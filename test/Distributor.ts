import { ethers } from 'hardhat';
import { loadFixture, mine } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, utils } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { expect } from 'chai';

import {
    ERC20,
    ERC20Votes,
    ZunDistributor,
    ApproveGauge,
    TransferGauge,
} from '../../typechain-types';

describe('Distributor tests', () => {
    async function deployFixture() {
        // Contracts are deployed using the first signer/account by default
        const [voter, dao, approveGaugeRec, transferGaugeRec, addedGaugeRec] =
            await ethers.getSigners();

        // deploy test ERC20 token
        const ERC20Factory = await ethers.getContractFactory('ERC20Token');
        const ZUN = (await ERC20Factory.deploy()) as ERC20;

        // deploy test ERC20Votes token
        const ERC20VotesFactory = await ethers.getContractFactory('ERC20VotesToken');
        const vlZUN = (await ERC20VotesFactory.deploy()) as ERC20Votes;

        await vlZUN.delegate(voter.address);
        expect(await vlZUN.getVotes(voter.address)).to.eq(parseUnits('100000', 'ether'));

        // deploy test gauges
        const ApproveGaugeFactory = await ethers.getContractFactory('ApproveGauge');
        const approveGauge = (await ApproveGaugeFactory.deploy(
            dao.address,
            ZUN.address,
            approveGaugeRec.address
        )) as ApproveGauge;

        const TransferGaugeFactory = await ethers.getContractFactory('TransferGauge');
        const transferGauge = (await TransferGaugeFactory.deploy(
            ZUN.address,
            transferGaugeRec.address
        )) as TransferGauge;

        const addedGauge = (await TransferGaugeFactory.deploy(
            ZUN.address,
            addedGaugeRec.address
        )) as TransferGauge;

        // deploy distributor contract
        const ZunDistributorFactory = await ethers.getContractFactory('ZunDistributor');
        const distributor = (await ZunDistributorFactory.deploy(
            ZUN.address,
            vlZUN.address,
            dao.address,
            0,
            [approveGauge.address, transferGauge.address],
            [parseUnits('1000', 'ether'), parseUnits('1000', 'ether')]
        )) as ZunDistributor;

        await ZUN.transfer(distributor.address, parseUnits('32000000', 'ether'));
        expect(await ZUN.balanceOf(distributor.address)).to.eq(parseUnits('32000000', 'ether'));

        return {
            voter,
            approveGauge,
            transferGauge,
            addedGauge,
            approveGaugeRec,
            transferGaugeRec,
            addedGaugeRec,
            ZUN,
            vlZUN,
            distributor,
            dao,
        };
    }

    it('should init correctly', async () => {
        const { voter, approveGauge, transferGauge, ZUN, vlZUN, distributor, dao } =
            await loadFixture(deployFixture);

        // check token
        expect(await vlZUN.balanceOf(voter.address)).to.eq(parseUnits('100000', 'ether'));

        // check distributor
        expect(await distributor.token()).to.eq(ZUN.address);
        expect(await distributor.voteToken()).to.eq(vlZUN.address);
        expect(await distributor.owner()).to.eq(dao.address);
        let gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.addr).to.eq(approveGauge.address);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.addr).to.eq(transferGauge.address);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));
        expect(await distributor.FIRST_YEAR_DISTRIBUTION_VALUE()).to.eq(
            parseUnits('11200000', 'ether')
        );
    });

    it('quorum reached', async () => {
        const {
            voter,
            approveGauge,
            transferGauge,
            approveGaugeRec,
            transferGaugeRec,
            ZUN,
            vlZUN,
            distributor,
            dao,
        } = await loadFixture(deployFixture);

        // vote
        await distributor.castVote(
            [0, 1],
            [parseUnits('2000', 'ether'), parseUnits('1000', 'ether')]
        );

        let gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('2000', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('1000', 'ether'));

        // wait 2 week - 100_800 blocks
        await mine(100_800);

        // distribute
        expect(await ZUN.balanceOf(approveGauge.address)).to.eq(0);
        expect(await ZUN.balanceOf(transferGauge.address)).to.eq(0);
        expect(await ZUN.balanceOf(approveGaugeRec.address)).to.eq(0);
        expect(await ZUN.balanceOf(transferGaugeRec.address)).to.eq(0);

        await distributor.distribute();

        gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('2000', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));

        expect(await ZUN.balanceOf(approveGauge.address)).to.eq(
            parseUnits('287179487179487179487179', 'wei')
        );
        expect(await ZUN.balanceOf(transferGauge.address)).to.eq(0);
        expect(await ZUN.balanceOf(approveGaugeRec.address)).to.eq(0);
        expect(await ZUN.allowance(approveGauge.address, approveGaugeRec.address)).to.eq(
            parseUnits('287179487179487179487179', 'wei')
        );
        expect(await ZUN.balanceOf(transferGaugeRec.address)).to.eq(
            parseUnits('143589743589743589743589', 'wei')
        );
    });

    it('quorum not reached', async () => {
        const {
            voter,
            approveGauge,
            transferGauge,
            approveGaugeRec,
            transferGaugeRec,
            ZUN,
            vlZUN,
            distributor,
            dao,
        } = await loadFixture(deployFixture);

        // set voting threshold
        expect(await distributor.votingThreshold()).to.eq(0);
        await distributor.connect(dao).setVotingThreshold(parseUnits('1000', 'ether'));
        expect(await distributor.votingThreshold()).to.eq(parseUnits('1000', 'ether'));

        // vote
        await distributor.castVote(
            [0, 1],
            [parseUnits('200', 'ether'), parseUnits('100', 'ether')]
        );

        let gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('200', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('100', 'ether'));

        // wait 2 week - 100_800 blocks
        await mine(100_800);

        // distribute
        expect(await ZUN.balanceOf(approveGauge.address)).to.eq(0);
        expect(await ZUN.balanceOf(transferGauge.address)).to.eq(0);
        expect(await ZUN.balanceOf(approveGaugeRec.address)).to.eq(0);
        expect(await ZUN.balanceOf(transferGaugeRec.address)).to.eq(0);

        await distributor.distribute();

        gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));

        expect(await ZUN.balanceOf(approveGauge.address)).to.eq(
            parseUnits('215384615384615384615384', 'wei')
        );
        expect(await ZUN.balanceOf(transferGauge.address)).to.eq(0);
        expect(await ZUN.balanceOf(approveGaugeRec.address)).to.eq(0);
        expect(await ZUN.allowance(approveGauge.address, approveGaugeRec.address)).to.eq(
            parseUnits('215384615384615384615384', 'wei')
        );
        expect(await ZUN.balanceOf(transferGaugeRec.address)).to.eq(
            parseUnits('215384615384615384615384', 'wei')
        );
    });

    it('insufficient voting power', async () => {
        const { voter, distributor } = await loadFixture(deployFixture);

        // vote
        await distributor.castVote(
            [0, 1],
            [parseUnits('200', 'ether'), parseUnits('100', 'ether')]
        );

        let lastFinalizeBlock = await distributor.lastFinalizeBlock();
        expect(await distributor.usedVotes(lastFinalizeBlock, voter.address)).to.eq(
            parseUnits('300', 'ether')
        );

        let gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('200', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('100', 'ether'));

        // vote with insufficient voting power
        await expect(
            distributor.castVote(
                [0, 1],
                [parseUnits('200000', 'ether'), parseUnits('100', 'ether')]
            )
        ).to.be.revertedWithCustomError(distributor, 'InsufficientVotePower');

        expect(await distributor.usedVotes(lastFinalizeBlock, voter.address)).to.eq(
            parseUnits('300', 'ether')
        );

        gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('200', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('100', 'ether'));
    });

    it('period distr is already happened', async () => {
        const {
            voter,
            approveGauge,
            transferGauge,
            approveGaugeRec,
            transferGaugeRec,
            ZUN,
            vlZUN,
            distributor,
            dao,
        } = await loadFixture(deployFixture);

        // vote
        await distributor.castVote(
            [0, 1],
            [parseUnits('2000', 'ether'), parseUnits('1000', 'ether')]
        );

        // wait 2 week - 100_800 blocks
        await mine(100_800);

        // distribute
        await distributor.distribute();

        expect(await ZUN.balanceOf(approveGauge.address)).to.eq(
            parseUnits('287179487179487179487179', 'wei')
        );
        expect(await ZUN.allowance(approveGauge.address, approveGaugeRec.address)).to.eq(
            parseUnits('287179487179487179487179', 'wei')
        );
        expect(await ZUN.balanceOf(transferGaugeRec.address)).to.eq(
            parseUnits('143589743589743589743589', 'wei')
        );

        await expect(distributor.distribute()).to.be.revertedWithCustomError(
            distributor,
            'DistributionAlreadyHappened'
        );
    });

    it('finalize voting on vote', async () => {
        const {
            voter,
            approveGauge,
            transferGauge,
            approveGaugeRec,
            transferGaugeRec,
            ZUN,
            vlZUN,
            distributor,
            dao,
        } = await loadFixture(deployFixture);

        // vote
        await distributor.castVote(
            [0, 1],
            [parseUnits('2000', 'ether'), parseUnits('1000', 'ether')]
        );

        let gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('2000', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('1000', 'ether'));

        // wait 2 week - 100_800 blocks
        await mine(100_800);

        // finalize voting on vote
        gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));

        await distributor.castVote(
            [0, 1],
            [parseUnits('3000', 'ether'), parseUnits('4000', 'ether')]
        );

        gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('2000', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));

        gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('3000', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('4000', 'ether'));
    });

    it('finalize voting on distribution', async () => {
        const {
            voter,
            approveGauge,
            transferGauge,
            approveGaugeRec,
            transferGaugeRec,
            ZUN,
            vlZUN,
            distributor,
            dao,
        } = await loadFixture(deployFixture);

        // vote
        await distributor.castVote(
            [0, 1],
            [parseUnits('2000', 'ether'), parseUnits('1000', 'ether')]
        );

        let gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('2000', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('1000', 'ether'));

        // wait 2 week - 100_800 blocks
        await mine(100_800);

        // finalize voting on distribution

        gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));

        await distributor.distribute();

        gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('2000', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));

        gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.currentVotes).to.eq(0);
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.currentVotes).to.eq(0);
    });

    it('should vote with signature', async () => {
        const { voter, approveGauge, transferGauge, vlZUN, distributor, dao } = await loadFixture(
            deployFixture
        );

        const gaugeIds = [0, 1];
        const amounts = [parseUnits('2000', 'ether'), parseUnits('1000', 'ether')];

        // prepare signature
        const domainData = {
            name: 'ZunamiDistributor',
            version: '1',
            chainId: 31337,
            verifyingContract: distributor.address,
        };

        const Ballot = [
            { name: 'gaugeIdsHash', type: 'bytes32' },
            { name: 'amountsHash', type: 'bytes32' },
            { name: 'voter', type: 'address' },
            { name: 'nonce', type: 'uint256' },
        ];

        const types = {
            Ballot,
        };

        const message = {
            gaugeIdsHash: utils.keccak256(utils.defaultAbiCoder.encode(['uint256[]'], [gaugeIds])),
            amountsHash: utils.keccak256(utils.defaultAbiCoder.encode(['uint256[]'], [amounts])),
            voter: voter.address,
            nonce: 0,
        };
        const signature = await voter._signTypedData(domainData, types, message);

        // vote
        await distributor.connect(dao).castVoteBySig(gaugeIds, amounts, voter.address, signature);

        let gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('2000', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.currentVotes).to.eq(parseUnits('1000', 'ether'));
    });

    it.skip('should distribute all', async () => {
        const {
            voter,
            approveGauge,
            transferGauge,
            approveGaugeRec,
            transferGaugeRec,
            ZUN,
            vlZUN,
            distributor,
            dao,
        } = await loadFixture(deployFixture);

        // distribute in cycle
        for (let i = 0; i < 240; i++) {
            // check yearDistributionValue()
            // check distributionValue()

            // check result of full distribution

            // vote
            await distributor.castVote(
                [0, 1],
                [parseUnits('2000', 'ether'), parseUnits('1000', 'ether')]
            );

            let gaugeItem = await distributor.gauges(0);
            expect(gaugeItem.currentVotes).to.eq(parseUnits('2000', 'ether'));
            gaugeItem = await distributor.gauges(1);
            expect(gaugeItem.currentVotes).to.eq(parseUnits('1000', 'ether'));

            // wait 2 week - 100_800 blocks
            await mine(100_800);

            // distribute
            expect(await ZUN.balanceOf(approveGauge.address)).to.eq(0);
            expect(await ZUN.balanceOf(transferGauge.address)).to.eq(0);
            expect(await ZUN.balanceOf(approveGaugeRec.address)).to.eq(0);
            expect(await ZUN.balanceOf(transferGaugeRec.address)).to.eq(0);

            await distributor.distribute();

            gaugeItem = await distributor.gauges(0);
            expect(gaugeItem.finalizedVotes).to.eq(parseUnits('2000', 'ether'));
            gaugeItem = await distributor.gauges(1);
            expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));

            expect(await ZUN.balanceOf(approveGauge.address)).to.eq(
                parseUnits('287179487179487179487179', 'wei')
            );
            expect(await ZUN.balanceOf(transferGauge.address)).to.eq(0);
            expect(await ZUN.balanceOf(approveGaugeRec.address)).to.eq(0);
            expect(await ZUN.allowance(approveGauge.address, approveGaugeRec.address)).to.eq(
                parseUnits('287179487179487179487179', 'wei')
            );
            expect(await ZUN.balanceOf(transferGaugeRec.address)).to.eq(
                parseUnits('143589743589743589743589', 'wei')
            );
        }
    });

    it('out of tokens for distribution', async () => {
        const { voter, approveGauge, transferGauge, vlZUN, distributor, dao } = await loadFixture(
            deployFixture
        );
    });

    it('stop distribution', async () => {
        const { voter, approveGauge, transferGauge, vlZUN, distributor, dao } = await loadFixture(
            deployFixture
        );
    });

    it('add gauge', async () => {
        const { voter, approveGauge, transferGauge, addedGauge, distributor, dao } =
            await loadFixture(deployFixture);

        expect(await distributor.gaugesNumber()).to.eq(2);

        await distributor.connect(dao).addGauge(addedGauge.address);

        expect(await distributor.gaugesNumber()).to.eq(3);

        let gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.addr).to.eq(approveGauge.address);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.addr).to.eq(transferGauge.address);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));
        gaugeItem = await distributor.gauges(2);
        expect(gaugeItem.addr).to.eq(addedGauge.address);
        expect(gaugeItem.finalizedVotes).to.eq(0);
    });

    it('delete gauge', async () => {
        const { voter, approveGauge, transferGauge, addedGauge, distributor, dao } =
            await loadFixture(deployFixture);

        expect(await distributor.gaugesNumber()).to.eq(2);

        await distributor.connect(dao).addGauge(addedGauge.address);

        expect(await distributor.gaugesNumber()).to.eq(3);

        await distributor.connect(dao).deleteGauge(0);

        expect(await distributor.gaugesNumber()).to.eq(2);

        let gaugeItem = await distributor.gauges(0);
        expect(gaugeItem.addr).to.eq(transferGauge.address);
        expect(gaugeItem.finalizedVotes).to.eq(parseUnits('1000', 'ether'));
        gaugeItem = await distributor.gauges(1);
        expect(gaugeItem.addr).to.eq(addedGauge.address);
        expect(gaugeItem.finalizedVotes).to.eq(0);
    });

    it('withdraw stuck token', async () => {
        const { voter, approveGauge, transferGauge, vlZUN, distributor, dao } = await loadFixture(
            deployFixture
        );
    });

    it('vote/distribute/distributeAmount before start block', async () => {
        const { voter, approveGauge, transferGauge, vlZUN, distributor, dao } = await loadFixture(
            deployFixture
        );
    });

    it('distribution in border of years', async () => {
        const { voter, approveGauge, transferGauge, vlZUN, distributor, dao } = await loadFixture(
            deployFixture
        );
    });
});
