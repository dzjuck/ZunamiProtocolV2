import {
    impersonateAccount,
    loadFixture,
    reset,
    setBalance,
} from '@nomicfoundation/hardhat-network-helpers';
import { IERC20, IVotemarket, VotemarketGauge } from '../../typechain-types';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { FORK_BLOCK_NUMBER, PROVIDER_URL } from '../../hardhat.config';
import { parseEther } from 'ethers/lib/utils';
import { max } from 'hardhat/internal/util/bigint';
import { bn } from '../unit/ZunamiPool.unit';
import { BigNumberish } from 'ethers';

const VOTEMARKET_ADDRESS = '0x0000000895cB182E6f983eb4D8b4E0Aa0B31Ae4c';
const ZUN_ADDRESS = '0x6b5204B0Be36771253Cc38e88012E02B752f0f36';
const crvUSD_zunUSD_BOUNTY_ID = 236;
const CURRENT_crvUSD_zunUSD_BOUNTY_MANAGER = '0xF9605D8c4c987d7Cb32D0d11FbCb8EeeB1B22D5d';
const GENERIC_ORACLE = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';

describe('Votemarket Gauge', async () => {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployFixture() {
        await reset(PROVIDER_URL, 20196625);

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount, otherAccount1] = await ethers.getSigners();

        const VotemarketGaugeFactory = await ethers.getContractFactory('VotemarketGauge');
        const crvUsdZunUsdVotemarketGauge = (await VotemarketGaugeFactory.deploy(
            ZUN_ADDRESS,
            crvUSD_zunUSD_BOUNTY_ID,
            GENERIC_ORACLE
        )) as VotemarketGauge;

        return {
            owner,
            otherAccount,
            otherAccount1,
            crvUsdZunUsdVotemarketGauge,
        };
    }

    // Reset the network to the initial state
    after(async function () {
        await reset(PROVIDER_URL, FORK_BLOCK_NUMBER);
    });

    describe('Deployment', async () => {
        it('Should correctly deploy the crvUSD_zunUSD gauge contract', async () => {
            // given
            const { owner, crvUsdZunUsdVotemarketGauge } = await loadFixture(deployFixture);

            // then
            expect(await crvUsdZunUsdVotemarketGauge.owner()).to.equal(owner.address);
            expect(await crvUsdZunUsdVotemarketGauge.BOUNTY_ID()).to.equal(crvUSD_zunUSD_BOUNTY_ID);
            expect(await crvUsdZunUsdVotemarketGauge.additionalPeriods()).to.equal(1);
            expect(await crvUsdZunUsdVotemarketGauge.TOKEN()).to.equal(ZUN_ADDRESS);
            expect(await crvUsdZunUsdVotemarketGauge.genericOracle()).to.equal(GENERIC_ORACLE);
        });
    });

    describe('Set additional periods', async () => {
        it('Should set additional periods', async () => {
            // given
            const { crvUsdZunUsdVotemarketGauge } = await loadFixture(deployFixture);

            // when
            const tx = await crvUsdZunUsdVotemarketGauge.setAdditionalPeriods(2);

            // then
            await expect(tx)
                .to.emit(crvUsdZunUsdVotemarketGauge, 'SetAdditionalPeriods')
                .withArgs(2);
            expect(await crvUsdZunUsdVotemarketGauge.additionalPeriods()).to.eq(2);
        });
        it('Should revert when set additional periods by not the owner', async () => {
            // given
            const { crvUsdZunUsdVotemarketGauge, otherAccount } = await loadFixture(deployFixture);

            // when
            const tx = crvUsdZunUsdVotemarketGauge.connect(otherAccount).setAdditionalPeriods(2);

            // then
            await expect(tx).to.revertedWithCustomError(
                crvUsdZunUsdVotemarketGauge,
                'OwnableUnauthorizedAccount'
            );
        });
    });

    describe('Set generic oracle', async () => {
        it('Should set generic oracle', async () => {
            // given
            const { crvUsdZunUsdVotemarketGauge, otherAccount } = await loadFixture(deployFixture);

            // when
            const tx = await crvUsdZunUsdVotemarketGauge.setGenericOracle(otherAccount.address);

            // then
            await expect(tx)
                .to.emit(crvUsdZunUsdVotemarketGauge, 'SetGenericOracle')
                .withArgs(otherAccount.address);
            expect(await crvUsdZunUsdVotemarketGauge.genericOracle()).to.eq(otherAccount.address);
        });
        it('Should revert when set additional periods by not the owner', async () => {
            // given
            const { crvUsdZunUsdVotemarketGauge, otherAccount } = await loadFixture(deployFixture);

            // when
            const tx = crvUsdZunUsdVotemarketGauge
                .connect(otherAccount)
                .setGenericOracle(otherAccount.address);

            // then
            await expect(tx).to.revertedWithCustomError(
                crvUsdZunUsdVotemarketGauge,
                'OwnableUnauthorizedAccount'
            );
        });
    });

    describe('Distribute', async () => {
        it('Should return and not distribute when amount is 0', async () => {
            // given
            const { crvUsdZunUsdVotemarketGauge } = await loadFixture(deployFixture);

            // when
            const tx = await crvUsdZunUsdVotemarketGauge.distribute(0);

            // then
            expect(tx).to.emit(crvUsdZunUsdVotemarketGauge, 'ZeroDistributionAmount');
        });
        it('Should distribute and increase bounty', async () => {
            // given
            const { crvUsdZunUsdVotemarketGauge } = await loadFixture(deployFixture);
            await impersonateAccount(CURRENT_crvUSD_zunUSD_BOUNTY_MANAGER);
            const impersonatedSigner = await ethers.getSigner(CURRENT_crvUSD_zunUSD_BOUNTY_MANAGER);
            // set balance to cover any tx costs
            await setBalance(
                CURRENT_crvUSD_zunUSD_BOUNTY_MANAGER,
                ethers.utils.parseEther('2').toHexString()
            );
            // provide ZUN to gauge
            const ZUN = (await ethers.getContractAt('IERC20', ZUN_ADDRESS)) as IERC20;
            await ZUN.connect(impersonatedSigner).transfer(
                crvUsdZunUsdVotemarketGauge.address,
                parseEther('4000')
            );
            // update bounty manager
            const VOTEMARKET = (await ethers.getContractAt(
                'IVotemarket',
                VOTEMARKET_ADDRESS
            )) as IVotemarket;
            await VOTEMARKET.connect(impersonatedSigner).updateManager(
                crvUSD_zunUSD_BOUNTY_ID,
                crvUsdZunUsdVotemarketGauge.address
            );

            const expectedMaxPricePerVote = '8892746029926595';

            // when
            const tx = await crvUsdZunUsdVotemarketGauge.distribute(parseEther('4000'));

            // then
            await expect(tx)
                .to.emit(crvUsdZunUsdVotemarketGauge, 'VotemarketIncreasedBountyDuration')
                .withArgs(crvUSD_zunUSD_BOUNTY_ID, 1, parseEther('4000'), (actual: BigNumberish) =>
                    expectCloseTo(actual, expectedMaxPricePerVote, '1000000000000')
                );
            expect(await ZUN.balanceOf(crvUsdZunUsdVotemarketGauge.address)).to.eq(0);
        });
        it('Should distribute and increase bounty twice', async () => {
            // given
            const { crvUsdZunUsdVotemarketGauge } = await loadFixture(deployFixture);
            await impersonateAccount(CURRENT_crvUSD_zunUSD_BOUNTY_MANAGER);
            const impersonatedSigner = await ethers.getSigner(CURRENT_crvUSD_zunUSD_BOUNTY_MANAGER);
            // set balance to cover any tx costs
            await setBalance(
                CURRENT_crvUSD_zunUSD_BOUNTY_MANAGER,
                ethers.utils.parseEther('2').toHexString()
            );
            // provide ZUN to gauge
            const ZUN = (await ethers.getContractAt('IERC20', ZUN_ADDRESS)) as IERC20;
            await ZUN.connect(impersonatedSigner).transfer(
                crvUsdZunUsdVotemarketGauge.address,
                parseEther('5000')
            );
            // update bounty manager
            const VOTEMARKET = (await ethers.getContractAt(
                'IVotemarket',
                VOTEMARKET_ADDRESS
            )) as IVotemarket;
            await VOTEMARKET.connect(impersonatedSigner).updateManager(
                crvUSD_zunUSD_BOUNTY_ID,
                crvUsdZunUsdVotemarketGauge.address
            );

            await crvUsdZunUsdVotemarketGauge.distribute(parseEther('4000'));

            const expectedMaxPricePerVote = '8892662386666693';

            // when
            const tx = await crvUsdZunUsdVotemarketGauge.distribute(parseEther('1000'));

            // then
            await expect(tx)
                .to.emit(crvUsdZunUsdVotemarketGauge, 'VotemarketIncreasedBountyDuration')
                .withArgs(crvUSD_zunUSD_BOUNTY_ID, 1, parseEther('1000'), (actual: BigNumberish) =>
                    expectCloseTo(actual, expectedMaxPricePerVote, '1000000000000')
                );
            expect(await ZUN.balanceOf(crvUsdZunUsdVotemarketGauge.address)).to.eq(0);
        });
    });

    describe('Update manager', async () => {
        it('Should update manager', async () => {
            // given
            const { crvUsdZunUsdVotemarketGauge, otherAccount } = await loadFixture(deployFixture);
            // update bounty manager
            await impersonateAccount(CURRENT_crvUSD_zunUSD_BOUNTY_MANAGER);
            const impersonatedSigner = await ethers.getSigner(CURRENT_crvUSD_zunUSD_BOUNTY_MANAGER);
            await setBalance(
                CURRENT_crvUSD_zunUSD_BOUNTY_MANAGER,
                ethers.utils.parseEther('2').toHexString()
            );
            const VOTEMARKET = (await ethers.getContractAt(
                'IVotemarket',
                VOTEMARKET_ADDRESS
            )) as IVotemarket;
            await VOTEMARKET.connect(impersonatedSigner).updateManager(
                crvUSD_zunUSD_BOUNTY_ID,
                crvUsdZunUsdVotemarketGauge.address
            );

            // when
            const tx = await crvUsdZunUsdVotemarketGauge.updateManager(otherAccount.address);

            // then
            await expect(tx)
                .to.emit(crvUsdZunUsdVotemarketGauge, 'UpdatedManager')
                .withArgs(otherAccount.address);
            expect((await VOTEMARKET.getBounty(crvUSD_zunUSD_BOUNTY_ID)).manager).to.eq(
                otherAccount.address
            );
        });
        it('Should revert when update manager by not the owner', async () => {
            // given
            const { crvUsdZunUsdVotemarketGauge, otherAccount } = await loadFixture(deployFixture);

            // when
            const tx = crvUsdZunUsdVotemarketGauge
                .connect(otherAccount)
                .updateManager(otherAccount.address);

            // then
            await expect(tx).to.revertedWithCustomError(
                crvUsdZunUsdVotemarketGauge,
                'OwnableUnauthorizedAccount'
            );
        });
    });
});

export function expectCloseTo(
    amount: BigNumberish,
    expectedAmount: BigNumberish,
    deltaAmount: BigNumberish
) {
    return expect(amount).closeTo(expectedAmount, deltaAmount);
}
