import { ethers } from 'hardhat';
import { loadFixture, mine } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, utils } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { expect } from 'chai';

import {
    ERC20,
    StakingRewardDistributor,
    ZunamiVotingToken
} from '../../typechain-types';

const ethUnits = (amount: number | string) => parseUnits(amount.toString(), 'ether');

describe('StakingRewardDistributor tests', () => {
    async function deployFixture() {
        // Contracts are deployed using the first signer/account by default
        const [admin, user1, user2, user3, earlyExitReceiver] =
            await ethers.getSigners();

        // deploy test ERC20 token
        const ERC20TokenFactory = await ethers.getContractFactory('ERC20Token');
        const ZUN = (await ERC20TokenFactory.deploy(18)) as ERC20;
        const REWARD = (await ERC20TokenFactory.deploy(18)) as ERC20;

        const ZunamiVotingTokenFactory = await ethers.getContractFactory('ZunamiVotingToken');
        const vlZUN = (await ZunamiVotingTokenFactory.deploy(admin.address)) as ZunamiVotingToken;

        // deploy distributor contract
        const StakingRewardDistributorFactory = await ethers.getContractFactory('StakingRewardDistributor');
        const stakingRewardDistributor = (await StakingRewardDistributorFactory.deploy()) as StakingRewardDistributor;

        await vlZUN.grantRole(await vlZUN.ISSUER_ROLE(), stakingRewardDistributor.address);

        await stakingRewardDistributor.setEarlyExitReceiver(earlyExitReceiver.address);

        return {
            stakingRewardDistributor,
            ZUN,
            vlZUN,
            REWARD,
            admin,
            users: [ user1, user2, user3 ],
            earlyExitReceiver,
        };
    }

    it('should distribute ZUN tokens', async () => {
        const { stakingRewardDistributor, ZUN, vlZUN, REWARD, admin, users, earlyExitReceiver  } =
            await loadFixture(deployFixture);

        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(ethUnits('0'));
        expect(await ZUN.balanceOf(admin.address)).to.eq(ethUnits('100000000'));
        expect(await ZUN.balanceOf(users[0].address)).to.eq(ethUnits('0'));
        expect(await vlZUN.balanceOf(users[0].address)).to.eq(ethUnits('0'));

        const tid = 0;
        await stakingRewardDistributor.addRewardToken(REWARD.address);

        const pid = 0;
        await stakingRewardDistributor.addPool(100, ZUN.address, vlZUN.address, false);

        await stakingRewardDistributor.grantRole(await stakingRewardDistributor.DISTRIBUTOR_ROLE(), admin.address);

        await ZUN.transfer(users[0].address, ethUnits('1000'));
        await ZUN.connect(users[0]).approve(stakingRewardDistributor.address, ethUnits('1000'));
        await stakingRewardDistributor.connect(users[0]).deposit(pid, ethUnits('1000'));
        expect(await vlZUN.balanceOf(users[0].address)).to.eq(ethUnits('1000'));

        await REWARD.approve(stakingRewardDistributor.address, ethUnits('100000000'));
        // distribute ZUN tokens
        await stakingRewardDistributor.distribute(tid, ethUnits('100000000'));

        expect(await REWARD.balanceOf(stakingRewardDistributor.address)).to.eq(ethUnits('100000000'));
        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(ethUnits('1000'));
        expect(await ZUN.balanceOf(admin.address)).to.eq(ethUnits('99999000'));
        expect(await ZUN.balanceOf(users[0].address)).to.eq(ethUnits('0'));

        // wait 2 week - 100_800 blocks
        await mine(100_800);

        await stakingRewardDistributor.connect(users[0]).claim(tid);

        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(ethUnits('1000'));
        expect(await REWARD.balanceOf(users[0].address)).to.eq(ethUnits('100000000'));

        await vlZUN.connect(users[0]).approve(stakingRewardDistributor.address, ethUnits('500'))
        await stakingRewardDistributor.connect(users[0]).withdraw(pid, ethUnits('500'));

        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(ethUnits('500'));
        expect(await ZUN.balanceOf(users[0].address)).to.eq(ethUnits('425'));
        expect(await ZUN.balanceOf(earlyExitReceiver.address)).to.eq(ethUnits('75'));

        await stakingRewardDistributor.connect(users[0]).claim(tid);
        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(ethUnits('500'));
        expect(await REWARD.balanceOf(users[0].address)).to.eq(ethUnits('100000000'));
    });
});
