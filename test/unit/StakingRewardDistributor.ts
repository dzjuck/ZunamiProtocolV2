import { ethers, upgrades } from 'hardhat';
import { loadFixture, mine } from '@nomicfoundation/hardhat-network-helpers';
import { parseUnits } from 'ethers/lib/utils';
import { expect } from 'chai';

import { ERC20, StakingRewardDistributor, ZunamiVotingToken } from '../../typechain-types';

const ethUnits = (amount: number | string) => parseUnits(amount.toString(), 'ether');

const BLOCKS_IN_1_DAYS = (24 * 60 * 60) / 12;
const BLOCKS_IN_1_WEEKS = BLOCKS_IN_1_DAYS * 7;
const BLOCKS_IN_2_WEEKS = BLOCKS_IN_1_WEEKS * 2;
const BLOCKS_IN_3_WEEKS = BLOCKS_IN_1_WEEKS * 3;
const BLOCKS_IN_4_MONTHS = BLOCKS_IN_1_DAYS * 30 * 4;
const ACC_REWARD_PRECISION = 1e12;

describe('StakingRewardDistributor tests', () => {
    async function deployFixture() {
        // Contracts are deployed using the first signer/account by default
        const [admin, user1, user2, user3, earlyExitReceiver] = await ethers.getSigners();

        // deploy test ERC20 token
        const ERC20TokenFactory = await ethers.getContractFactory('ERC20Token');
        const ZUN = (await ERC20TokenFactory.deploy(18)) as ERC20;
        const REWARD = (await ERC20TokenFactory.deploy(18)) as ERC20;
        const REWARD2 = (await ERC20TokenFactory.deploy(18)) as ERC20;

        const ZunamiVotingTokenFactory = await ethers.getContractFactory('ZunamiVotingToken');
        const vlZUN = (await ZunamiVotingTokenFactory.deploy(admin.address)) as ZunamiVotingToken;

        // deploy distributor contract
        const StakingRewardDistributorFactory = await ethers.getContractFactory(
            'StakingRewardDistributor'
        );

        const instance = await upgrades.deployProxy(StakingRewardDistributorFactory, [], {
            kind: 'uups',
        });
        await instance.deployed();

        const stakingRewardDistributor = instance as StakingRewardDistributor;

        await vlZUN.grantRole(await vlZUN.ISSUER_ROLE(), stakingRewardDistributor.address);

        await stakingRewardDistributor.setEarlyExitReceiver(earlyExitReceiver.address);

        return {
            stakingRewardDistributor,
            ZUN,
            vlZUN,
            REWARD,
            REWARD2,
            admin,
            users: [user1, user2, user3],
            earlyExitReceiver,
        };
    }

    async function depositByTwoUsersState(depositAmount1, depositAmount2, fixture) {
        const { stakingRewardDistributor, ZUN, vlZUN, REWARD, REWARD2, admin, users } = fixture;

        // start balances
        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(ethUnits('0'));
        expect(await ZUN.balanceOf(admin.address)).to.eq(ethUnits('100000000'));
        expect(await ZUN.balanceOf(users[0].address)).to.eq(ethUnits('0'));
        expect(await ZUN.balanceOf(users[1].address)).to.eq(ethUnits('0'));
        expect(await vlZUN.balanceOf(users[0].address)).to.eq(ethUnits('0'));
        expect(await vlZUN.balanceOf(users[1].address)).to.eq(ethUnits('0'));

        // add reward tokens and pool
        const tid1 = 0;
        await stakingRewardDistributor.addRewardToken(REWARD.address);
        const tid2 = 1;
        await stakingRewardDistributor.addRewardToken(REWARD2.address);
        const pid = 0;
        await stakingRewardDistributor.addPool(100, ZUN.address, vlZUN.address, false);

        // add DISTRIBUTOR_ROLE to admin
        await stakingRewardDistributor.grantRole(
            await stakingRewardDistributor.DISTRIBUTOR_ROLE(),
            admin.address
        );

        // users deposit ZUN tokens
        if (depositAmount1) {
            const amount1 = ethUnits(depositAmount1);
            await ZUN.transfer(users[0].address, amount1);
            await ZUN.connect(users[0]).approve(stakingRewardDistributor.address, amount1);
            await stakingRewardDistributor.connect(users[0]).deposit(pid, amount1);
            expect(await vlZUN.balanceOf(users[0].address)).to.eq(amount1);
        }
        if (depositAmount2) {
            const amount2 = ethUnits(depositAmount2);
            await ZUN.transfer(users[1].address, amount2);
            await ZUN.connect(users[1]).approve(stakingRewardDistributor.address, amount2);
            await stakingRewardDistributor.connect(users[1]).deposit(pid, amount2);
            expect(await vlZUN.balanceOf(users[1].address)).to.eq(amount2);
        }

        // check rewards info
        const rewardTokenInfoBefore = await stakingRewardDistributor.rewardTokenInfo(tid1);
        expect(rewardTokenInfoBefore.distributionBlock).to.be.eq(0);
        expect(rewardTokenInfoBefore.rewardPerBlock).to.be.eq(0);

        // check pool info
        const [poolInfoBefore] = await stakingRewardDistributor.getAllPools();
        expect(poolInfoBefore.accRewardsPerShare[tid1]).to.be.eq(0);
        expect(poolInfoBefore.lastRewardBlocks[tid1]).to.be.eq(0);

        return {
            tid1,
            tid2,
            pid,
        };
    }

    it('reallocate single pool', async () => {
        const fixture = await loadFixture(deployFixture);

        const depositAmount1 = 1000;
        const depositAmount2 = 2000;
        const { pid } = await depositByTwoUsersState(depositAmount1, depositAmount2, fixture);
        const { stakingRewardDistributor } = fixture;

        // check allocation before
        const totalAllocPointBefore = await stakingRewardDistributor.totalAllocPoint();
        const [poolInfoBefore] = await stakingRewardDistributor.getAllPools();
        expect(totalAllocPointBefore).to.be.eq(poolInfoBefore.allocPoint);
        expect(totalAllocPointBefore).to.be.eq(100);

        await stakingRewardDistributor.reallocatePool(pid, 20, true);

        // check allocation after
        const totalAllocPointAfter = await stakingRewardDistributor.totalAllocPoint();
        const [poolInfoAfter] = await stakingRewardDistributor.getAllPools();
        expect(totalAllocPointAfter).to.be.eq(poolInfoAfter.allocPoint);
        expect(totalAllocPointAfter).to.be.eq(20);
    });

    it('should deposit ZUN tokens and get vlZUN', async () => {
        const {
            stakingRewardDistributor,
            ZUN,
            vlZUN,
            REWARD,
            REWARD2,
            admin,
            users,
            earlyExitReceiver,
        } = await loadFixture(deployFixture);

        // TODO: try to deposit without any pool
        // await stakingRewardDistributor.connect(users[0]).deposit(0, ethUnits('1000'));

        const pid = 0;
        await stakingRewardDistributor.addPool(100, ZUN.address, vlZUN.address, false);

        // balances of ZUN and vlZUN are empty
        expect(await ZUN.balanceOf(users[0].address)).to.eq(ethUnits('0'));
        expect(await ZUN.balanceOf(users[1].address)).to.eq(ethUnits('0'));
        expect(await vlZUN.balanceOf(users[0].address)).to.eq(ethUnits('0'));
        expect(await vlZUN.balanceOf(users[1].address)).to.eq(ethUnits('0'));

        // try to deposit without tokens
        await expect(
            stakingRewardDistributor.connect(users[0]).deposit(pid, ethUnits('1000'))
        ).to.be.revertedWithCustomError(ZUN, 'ERC20InsufficientAllowance');

        // users receive ZUN and deposit to distributor
        await ZUN.transfer(users[0].address, ethUnits('1000'));
        await ZUN.transfer(users[1].address, ethUnits('2000'));
        await ZUN.connect(users[0]).approve(stakingRewardDistributor.address, ethUnits('1000'));
        await ZUN.connect(users[1]).approve(stakingRewardDistributor.address, ethUnits('2000'));
        await stakingRewardDistributor.connect(users[0]).deposit(pid, ethUnits('1000'));
        await stakingRewardDistributor.connect(users[1]).deposit(pid, ethUnits('2000'));
        expect(await vlZUN.balanceOf(users[0].address)).to.eq(ethUnits('1000'));
        expect(await vlZUN.balanceOf(users[1].address)).to.eq(ethUnits('2000'));

        // TODO: try to deposit 0 ZUN
        // await stakingRewardDistributor.connect(users[0]).deposit(pid, ethUnits('0'));
    });

    it('reward tokens distribution', async () => {
        const fixture = await loadFixture(deployFixture);

        const depositAmount1 = 1000;
        const depositAmount2 = 2000;
        const { tid1 } = await depositByTwoUsersState(depositAmount1, depositAmount2, fixture);
        const { stakingRewardDistributor, REWARD } = fixture;

        // distribution
        const distributionAmount = ethUnits('100000000');
        await REWARD.approve(stakingRewardDistributor.address, distributionAmount);
        await stakingRewardDistributor.distribute(tid1, distributionAmount);

        // check rewards info
        const currentBlock = await ethers.provider.getBlockNumber();
        const rewardTokenInfo = await stakingRewardDistributor.rewardTokenInfo(tid1);
        expect(rewardTokenInfo.distributionBlock).to.be.eq(currentBlock);
        expect(rewardTokenInfo.rewardPerBlock).to.be.eq(distributionAmount.div(BLOCKS_IN_2_WEEKS));

        const [poolInfo] = await stakingRewardDistributor.getAllPools();
        expect(poolInfo.accRewardsPerShare[tid1]).to.be.eq(0);
        expect(poolInfo.lastRewardBlocks[tid1]).to.be.eq(currentBlock);
    });

    it('second distribution at the same block as first', async () => {
        const fixture = await loadFixture(deployFixture);

        const depositAmount1 = 1000;
        const depositAmount2 = 2000;
        const { tid1 } = await depositByTwoUsersState(depositAmount1, depositAmount2, fixture);
        const { stakingRewardDistributor, REWARD } = fixture;

        await ethers.provider.send('evm_setAutomine', [false]);

        // distribution
        const distributionAmount = ethUnits('50000000');
        await REWARD.approve(stakingRewardDistributor.address, distributionAmount);
        await stakingRewardDistributor.distribute(tid1, distributionAmount);

        await REWARD.approve(stakingRewardDistributor.address, distributionAmount);
        await stakingRewardDistributor.distribute(tid1, distributionAmount);

        await mine();
        await ethers.provider.send('evm_setAutomine', [true]);

        // check rewards info
        const currentBlock = await ethers.provider.getBlockNumber();
        const rewardTokenInfo = await stakingRewardDistributor.rewardTokenInfo(tid1);
        expect(rewardTokenInfo.distributionBlock).to.be.eq(currentBlock);
        expect(rewardTokenInfo.rewardPerBlock).to.be.eq(
            distributionAmount.mul(2).div(BLOCKS_IN_2_WEEKS)
        );

        const [poolInfo] = await stakingRewardDistributor.getAllPools();
        expect(poolInfo.accRewardsPerShare[tid1]).to.be.eq(0);
        expect(poolInfo.lastRewardBlocks[tid1]).to.be.eq(currentBlock);
    });

    it('second distribution after 1 week', async () => {
        const fixture = await loadFixture(deployFixture);

        const depositAmount1 = 1000;
        const depositAmount2 = 2000;
        const { tid1 } = await depositByTwoUsersState(depositAmount1, depositAmount2, fixture);
        const { stakingRewardDistributor, REWARD } = fixture;

        // first distribution
        const firstDistributionAmount = ethUnits('10000000');
        await REWARD.approve(stakingRewardDistributor.address, firstDistributionAmount);
        await stakingRewardDistributor.distribute(tid1, firstDistributionAmount);
        const firstDistributionBlock = await ethers.provider.getBlockNumber();
        const firstRewardPerShare = firstDistributionAmount.div(BLOCKS_IN_2_WEEKS);

        await mine(BLOCKS_IN_1_WEEKS);

        // second distribution after a week
        const secondDistributionAmount = ethUnits('20000000');
        await REWARD.approve(stakingRewardDistributor.address, secondDistributionAmount);
        await stakingRewardDistributor.distribute(tid1, secondDistributionAmount);
        const secondDistributionBlock = await ethers.provider.getBlockNumber();

        // check rewards info
        const rewardTokenInfo = await stakingRewardDistributor.rewardTokenInfo(tid1);
        const remainderBlocks =
            firstDistributionBlock + BLOCKS_IN_2_WEEKS - secondDistributionBlock;
        expect(rewardTokenInfo.rewardPerBlock).to.be.eq(
            secondDistributionAmount
                .add(firstRewardPerShare.mul(remainderBlocks))
                .div(BLOCKS_IN_2_WEEKS)
        );
        expect(rewardTokenInfo.distributionBlock).to.be.eq(secondDistributionBlock);

        // check pool info
        const [poolInfo] = await stakingRewardDistributor.getAllPools();
        expect(poolInfo.accRewardsPerShare[tid1]).to.be.eq(
            firstRewardPerShare
                .mul(BLOCKS_IN_2_WEEKS - remainderBlocks)
                .mul(ACC_REWARD_PRECISION)
                .div(ethUnits(depositAmount1 + depositAmount2))
        );
        expect(poolInfo.lastRewardBlocks[tid1]).to.be.eq(secondDistributionBlock);
    });

    it.skip('second distribution after 2 weeks - edge case', async () => {
        // TODO
    });

    it('second distribution after 3 weeks', async () => {
        const fixture = await loadFixture(deployFixture);

        const depositAmount1 = 1000;
        const depositAmount2 = 2000;
        const { tid1 } = await depositByTwoUsersState(depositAmount1, depositAmount2, fixture);
        const { stakingRewardDistributor, REWARD } = fixture;

        // first distribution
        const firstDistributionAmount = ethUnits('10000000');
        await REWARD.approve(stakingRewardDistributor.address, firstDistributionAmount);
        await stakingRewardDistributor.distribute(tid1, firstDistributionAmount);
        const firstDistributionBlock = await ethers.provider.getBlockNumber();
        const firstRewardPerShare = firstDistributionAmount.div(BLOCKS_IN_2_WEEKS);

        await mine(BLOCKS_IN_3_WEEKS);

        // second distribution after 3 weeks
        const secondDistributionAmount = ethUnits('20000000');
        await REWARD.approve(stakingRewardDistributor.address, secondDistributionAmount);
        await stakingRewardDistributor.distribute(tid1, secondDistributionAmount);
        const secondDistributionBlock = await ethers.provider.getBlockNumber();

        // check rewards info
        const rewardTokenInfo = await stakingRewardDistributor.rewardTokenInfo(tid1);
        expect(rewardTokenInfo.rewardPerBlock).to.be.eq(
            secondDistributionAmount.div(BLOCKS_IN_2_WEEKS)
        );
        expect(rewardTokenInfo.distributionBlock).to.be.eq(secondDistributionBlock);

        // check pool info
        const [poolInfo] = await stakingRewardDistributor.getAllPools();
        const firstAccRewardPerShare = firstDistributionAmount
            .mul(ACC_REWARD_PRECISION)
            .div(ethUnits(depositAmount1 + depositAmount2));
        const secondRewardPerShare = secondDistributionAmount.div(BLOCKS_IN_2_WEEKS);
        const secondAccRewardPerShare = secondRewardPerShare
            .mul(secondDistributionBlock - firstDistributionBlock - BLOCKS_IN_2_WEEKS)
            .mul(ACC_REWARD_PRECISION)
            .div(ethUnits(depositAmount1 + depositAmount2));
        expect(poolInfo.accRewardsPerShare[tid1]).to.be.eq(
            firstAccRewardPerShare.add(secondAccRewardPerShare)
        );
        expect(poolInfo.lastRewardBlocks[tid1]).to.be.eq(secondDistributionBlock);
    });

    it.skip('second distribution after more then 4 weeks', async () => {
        // TODO
    });

    it('second distribution after 3 weeks for two rewards', async () => {
        const fixture = await loadFixture(deployFixture);

        const depositAmount1 = 1000;
        const depositAmount2 = 2000;
        const { tid1, tid2 } = await depositByTwoUsersState(
            depositAmount1,
            depositAmount2,
            fixture
        );
        const { stakingRewardDistributor, REWARD, REWARD2 } = fixture;

        // first distribution of REWARD
        const firstDistributionAmount1 = ethUnits('1000000');
        await REWARD.approve(stakingRewardDistributor.address, firstDistributionAmount1);
        await stakingRewardDistributor.distribute(tid1, firstDistributionAmount1);
        const firstDistributionBlock1 = await ethers.provider.getBlockNumber();
        const firstRewardPerShare1 = firstDistributionAmount1.div(BLOCKS_IN_2_WEEKS);

        // do a delay in a day between distribution of REWARD and REWARD2
        await mine(BLOCKS_IN_1_DAYS);

        // first distribution of REWARD
        const firstDistributionAmount2 = ethUnits('1600000');
        await REWARD2.approve(stakingRewardDistributor.address, firstDistributionAmount2);
        await stakingRewardDistributor.distribute(tid2, firstDistributionAmount2);
        const firstDistributionBlock2 = await ethers.provider.getBlockNumber();
        const firstRewardPerShare2 = firstDistributionAmount2.div(BLOCKS_IN_2_WEEKS);

        await mine(BLOCKS_IN_3_WEEKS);

        // second distribution after 3 weeks of REWARD
        const secondDistributionAmount1 = ethUnits('2000000');
        await REWARD.approve(stakingRewardDistributor.address, secondDistributionAmount1);
        await stakingRewardDistributor.distribute(tid1, secondDistributionAmount1);
        const secondDistributionBlock1 = await ethers.provider.getBlockNumber();

        // second distribution after 3 weeks of REWARD2
        const secondDistributionAmount2 = ethUnits('2500000');
        await REWARD2.approve(stakingRewardDistributor.address, secondDistributionAmount2);
        await stakingRewardDistributor.distribute(tid2, secondDistributionAmount2);
        const secondDistributionBlock2 = await ethers.provider.getBlockNumber();

        // check rewards info of REWARD
        const rewardTokenInfo1 = await stakingRewardDistributor.rewardTokenInfo(tid1);
        const secondRewardPerShare1 = secondDistributionAmount1.div(BLOCKS_IN_2_WEEKS);
        expect(rewardTokenInfo1.rewardPerBlock).to.be.eq(secondRewardPerShare1);
        expect(rewardTokenInfo1.distributionBlock).to.be.eq(secondDistributionBlock1);

        // check rewards info of REWARD2
        const rewardTokenInfo2 = await stakingRewardDistributor.rewardTokenInfo(tid2);
        const secondRewardPerShare2 = secondDistributionAmount2.div(BLOCKS_IN_2_WEEKS);
        expect(rewardTokenInfo2.rewardPerBlock).to.be.eq(secondRewardPerShare2);
        expect(rewardTokenInfo2.distributionBlock).to.be.eq(secondDistributionBlock2);

        // check pool info of REWARD
        const [poolInfo] = await stakingRewardDistributor.getAllPools();
        const firstAccRewardPerShare1 = firstDistributionAmount1
            .mul(ACC_REWARD_PRECISION)
            .div(ethUnits(depositAmount1 + depositAmount2));
        const secondAccRewardPerShare1 = secondRewardPerShare1
            .mul(secondDistributionBlock1 + 2 - firstDistributionBlock1 - BLOCKS_IN_2_WEEKS)
            .mul(ACC_REWARD_PRECISION)
            .div(ethUnits(depositAmount1 + depositAmount2));
        // TODO: refactor, because of 2 wei as rounding error
        expect(poolInfo.accRewardsPerShare[tid1]).to.be.eq(
            firstAccRewardPerShare1.add(secondAccRewardPerShare1).sub(2)
        );
        expect(poolInfo.lastRewardBlocks[tid1]).to.be.eq(secondDistributionBlock2);

        // check pool info of REWARD2
        const firstAccRewardPerShare = firstDistributionAmount2
            .mul(ACC_REWARD_PRECISION)
            .div(ethUnits(depositAmount1 + depositAmount2));
        const secondAccRewardPerShare = secondRewardPerShare2
            .mul(secondDistributionBlock2 - firstDistributionBlock2 - BLOCKS_IN_2_WEEKS)
            .mul(ACC_REWARD_PRECISION)
            .div(ethUnits(depositAmount1 + depositAmount2));
        expect(poolInfo.accRewardsPerShare[tid2]).to.be.eq(
            firstAccRewardPerShare.add(secondAccRewardPerShare)
        );
        expect(poolInfo.lastRewardBlocks[tid2]).to.be.eq(secondDistributionBlock2);
    });

    it('claim 1 day after distribution for one reward token', async () => {
        const fixture = await loadFixture(deployFixture);

        const depositAmount1 = 1000;
        const depositAmount2 = 2000;
        const { tid1 } = await depositByTwoUsersState(depositAmount1, depositAmount2, fixture);
        const { stakingRewardDistributor, REWARD, users } = fixture;

        // distribution
        const distributionAmount = ethUnits('100000000');
        await REWARD.approve(stakingRewardDistributor.address, distributionAmount);
        await stakingRewardDistributor.distribute(tid1, distributionAmount);

        await mine(BLOCKS_IN_1_DAYS);

        // check balances before claim
        expect(await REWARD.balanceOf(users[0].address)).to.eq(0);

        // claim
        await stakingRewardDistributor.connect(users[0]).claim(tid1);
        const [poolInfo] = await stakingRewardDistributor.getAllPools();

        // check balances after claim
        const accruedRewards = ethUnits(depositAmount1)
            .mul(poolInfo.accRewardsPerShare[tid1])
            .div(ACC_REWARD_PRECISION);
        expect(await REWARD.balanceOf(users[0].address)).to.eq(accruedRewards);
    });

    it('get pending rewards 2 weeks after distribution for one reward token', async () => {
        const fixture = await loadFixture(deployFixture);

        const depositAmount1 = 1000;
        const depositAmount2 = 2000;
        const { pid, tid1 } = await depositByTwoUsersState(depositAmount1, depositAmount2, fixture);
        const { stakingRewardDistributor, REWARD, users } = fixture;

        // distribution
        const distributionAmount = ethUnits('100000000');
        await REWARD.approve(stakingRewardDistributor.address, distributionAmount);
        await stakingRewardDistributor.distribute(tid1, distributionAmount);

        await mine(BLOCKS_IN_2_WEEKS);

        // get pending rewards
        const total = await stakingRewardDistributor.getPendingReward(tid1, pid, users[0].address);

        // check pending rewards
        const rewardTokenInfo = await stakingRewardDistributor.rewardTokenInfo(tid1);
        const reward = rewardTokenInfo.rewardPerBlock.mul(BLOCKS_IN_2_WEEKS);
        const accRewardPerShare = reward
            .mul(ACC_REWARD_PRECISION)
            .div(ethUnits(depositAmount1 + depositAmount2));
        const accruedRewards = ethUnits(depositAmount1)
            .mul(accRewardPerShare)
            .div(ACC_REWARD_PRECISION);
        expect(total).to.eq(accruedRewards);

        // TODO check the rounding error
        // expect(reward).to.eq(distributionAmount);
    });

    it('withdraw ZUN tokens immediately after deposit', async () => {
        const fixture = await loadFixture(deployFixture);

        const depositAmount1 = 1000;
        const depositAmount2 = 2000;
        const { pid } = await depositByTwoUsersState(depositAmount1, depositAmount2, fixture);
        const { stakingRewardDistributor, ZUN, vlZUN, users, earlyExitReceiver } = fixture;

        // check balances before withdraw
        expect(await vlZUN.balanceOf(users[0].address)).to.eq(ethUnits(depositAmount1));
        expect(await ZUN.balanceOf(users[0].address)).to.eq(ethUnits(0));
        expect(await ZUN.balanceOf(earlyExitReceiver.address)).to.eq(ethUnits(0));
        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(
            ethUnits(depositAmount1 + depositAmount2)
        );
        const totalAmountsBefore = await stakingRewardDistributor.totalAmounts(pid);

        const withdrawAmount = ethUnits(depositAmount1);
        await vlZUN.connect(users[0]).approve(stakingRewardDistributor.address, withdrawAmount);
        await stakingRewardDistributor.connect(users[0]).withdraw(pid, withdrawAmount);

        // check balances after withdraw - 15% of withdrawal has transfered to earlyExitReceiver
        expect(await vlZUN.balanceOf(users[0].address)).to.eq(0);
        expect(await ZUN.balanceOf(users[0].address)).to.eq(withdrawAmount.div(100).mul(85));
        expect(await ZUN.balanceOf(earlyExitReceiver.address)).to.eq(
            withdrawAmount.div(100).mul(15)
        );
        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(
            ethUnits(depositAmount2)
        );

        // check pool amounts
        const userPoolInfo = await stakingRewardDistributor.userPoolInfo(pid, users[0].address);
        expect(userPoolInfo.amount).to.eq(0);
        const totalAmountsAfter = await stakingRewardDistributor.totalAmounts(pid);
        expect(totalAmountsAfter).to.eq(totalAmountsBefore.sub(ethUnits(depositAmount1)));
    });

    it('withdraw ZUN tokens after 4 months', async () => {
        const fixture = await loadFixture(deployFixture);

        const depositAmount1 = 1000;
        const depositAmount2 = 2000;
        const { pid } = await depositByTwoUsersState(depositAmount1, depositAmount2, fixture);
        const { stakingRewardDistributor, ZUN, vlZUN, users, earlyExitReceiver } = fixture;

        // check balances before withdraw
        expect(await vlZUN.balanceOf(users[0].address)).to.eq(ethUnits(depositAmount1));
        expect(await ZUN.balanceOf(users[0].address)).to.eq(ethUnits(0));
        expect(await ZUN.balanceOf(earlyExitReceiver.address)).to.eq(ethUnits(0));
        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(
            ethUnits(depositAmount1 + depositAmount2)
        );

        await mine(BLOCKS_IN_4_MONTHS);

        const withdrawAmount = ethUnits(depositAmount1);
        await vlZUN.connect(users[0]).approve(stakingRewardDistributor.address, withdrawAmount);
        await stakingRewardDistributor.connect(users[0]).withdraw(pid, withdrawAmount);

        // check balances after withdraw
        expect(await vlZUN.balanceOf(users[0].address)).to.eq(0);
        expect(await ZUN.balanceOf(users[0].address)).to.eq(withdrawAmount);
        expect(await ZUN.balanceOf(earlyExitReceiver.address)).to.eq(0);
        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(
            ethUnits(depositAmount2)
        );
    });

    it('emergency withdraw ZUN tokens immediately after deposit', async () => {
        const fixture = await loadFixture(deployFixture);

        const depositAmount1 = 1000;
        const depositAmount2 = 2000;
        const { pid, tid1, tid2 } = await depositByTwoUsersState(
            depositAmount1,
            depositAmount2,
            fixture
        );
        const { stakingRewardDistributor, ZUN, vlZUN, users, earlyExitReceiver } = fixture;

        // check balances before withdraw
        expect(await vlZUN.balanceOf(users[0].address)).to.eq(ethUnits(depositAmount1));
        expect(await ZUN.balanceOf(users[0].address)).to.eq(ethUnits(0));
        expect(await ZUN.balanceOf(earlyExitReceiver.address)).to.eq(ethUnits(0));
        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(
            ethUnits(depositAmount1 + depositAmount2)
        );
        const totalAmountsBefore = await stakingRewardDistributor.totalAmounts(pid);

        const withdrawAmount = ethUnits(depositAmount1);
        await vlZUN.connect(users[0]).approve(stakingRewardDistributor.address, withdrawAmount);
        await stakingRewardDistributor.connect(users[0]).withdrawEmergency(pid);

        // check balances after withdraw - 15% of withdrawal has transfered to earlyExitReceiver
        expect(await vlZUN.balanceOf(users[0].address)).to.eq(0);
        expect(await ZUN.balanceOf(users[0].address)).to.eq(withdrawAmount.div(100).mul(85));
        expect(await ZUN.balanceOf(earlyExitReceiver.address)).to.eq(
            withdrawAmount.div(100).mul(15)
        );
        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(
            ethUnits(depositAmount2)
        );

        // check pool amounts
        const userPoolInfo = await stakingRewardDistributor.userPoolInfo(pid, users[0].address);
        expect(userPoolInfo.amount).to.eq(0);
        const totalAmountsAfter = await stakingRewardDistributor.totalAmounts(pid);
        expect(totalAmountsAfter).to.eq(totalAmountsBefore.sub(ethUnits(depositAmount1)));
    });

    it('withdraw stuck tokens', async () => {
        const { stakingRewardDistributor, users, admin } = await loadFixture(deployFixture);

        // deploy test ERC20 token
        const ERC20TokenFactory = await ethers.getContractFactory('ERC20Token');
        const WETH = (await ERC20TokenFactory.deploy(18)) as ERC20;
        const initalAdminBalance = await WETH.balanceOf(admin.address);

        // user has 100 WETH
        const amount = ethUnits(100);
        await WETH.transfer(users[0].address, amount);

        // check balances before
        const adminBalanceWETHBefore = await WETH.balanceOf(admin.address);
        expect(adminBalanceWETHBefore).to.eq(initalAdminBalance.sub(amount));

        await WETH.connect(users[0]).transfer(stakingRewardDistributor.address, amount);
        await stakingRewardDistributor.withdrawStuckToken(WETH.address);

        // check balances after
        const adminBalanceWETHAfter = await WETH.balanceOf(admin.address);
        expect(adminBalanceWETHBefore).to.eq(adminBalanceWETHAfter.sub(amount));
        expect(adminBalanceWETHAfter).to.eq(initalAdminBalance);
    });

    it('withdraw pool tokens from staking reward distributor', async () => {
        const fixture = await loadFixture(deployFixture);

        const depositAmount1 = 1000;
        const depositAmount2 = 2000;
        const { pid } = await depositByTwoUsersState(depositAmount1, depositAmount2, fixture);
        const { stakingRewardDistributor, ZUN, users } = fixture;

        // add RECAPITALIZATION_ROLE to user[2]
        await stakingRewardDistributor.grantRole(
            await stakingRewardDistributor.RECAPITALIZATION_ROLE(),
            users[2].address
        );

        // check balances before withdraw
        expect(await ZUN.balanceOf(users[2].address)).to.eq(ethUnits(0));
        expect(await stakingRewardDistributor.recapitalizedAmounts(pid)).to.eq(0);

        // withdraw pool tokens from staking reward distributor
        const withdrawAmount = 2500;
        await stakingRewardDistributor
            .connect(users[2])
            .withdrawPoolToken(ZUN.address, ethUnits(withdrawAmount));

        // check balances after withdraw
        expect(await ZUN.balanceOf(users[2].address)).to.eq(ethUnits(withdrawAmount));
        expect(await stakingRewardDistributor.recapitalizedAmounts(pid)).to.eq(
            ethUnits(withdrawAmount)
        );
    });

    it('return pool tokens to staking reward distributor', async () => {
        const fixture = await loadFixture(deployFixture);

        const depositAmount1 = 1000;
        const depositAmount2 = 2000;
        const { pid } = await depositByTwoUsersState(depositAmount1, depositAmount2, fixture);
        const { stakingRewardDistributor, ZUN, users } = fixture;

        // add RECAPITALIZATION_ROLE to user[2]
        await stakingRewardDistributor.grantRole(
            await stakingRewardDistributor.RECAPITALIZATION_ROLE(),
            users[2].address
        );

        // check balances before withdraw
        expect(await ZUN.balanceOf(users[2].address)).to.eq(ethUnits(0));
        expect(await stakingRewardDistributor.recapitalizedAmounts(pid)).to.eq(0);

        // withdraw pool tokens from staking reward distributor
        const withdrawAmount = 2500;
        await stakingRewardDistributor
            .connect(users[2])
            .withdrawPoolToken(ZUN.address, ethUnits(withdrawAmount));

        // check balances after withdraw
        expect(await ZUN.balanceOf(users[2].address)).to.eq(ethUnits(withdrawAmount));
        expect(await stakingRewardDistributor.recapitalizedAmounts(pid)).to.eq(
            ethUnits(withdrawAmount)
        );

        // return pool tokens from staking reward distributor
        await ZUN.connect(users[2]).approve(
            stakingRewardDistributor.address,
            ethUnits(withdrawAmount)
        );
        await stakingRewardDistributor
            .connect(users[2])
            .returnPoolToken(ZUN.address, ethUnits(withdrawAmount));

        // check balances after return
        expect(await ZUN.balanceOf(users[2].address)).to.eq(ethUnits(0));
        expect(await stakingRewardDistributor.recapitalizedAmounts(pid)).to.eq(ethUnits(0));
    });

    // TODO: exception araised because of a bug with reward token addition after pool
    it.skip('withdraw ajusted amount of tokens because of recapitalization', async () => {
        const fixture = await loadFixture(deployFixture);

        const depositAmount1 = 1000;
        const depositAmount2 = 2000;
        const { pid } = await depositByTwoUsersState(depositAmount1, depositAmount2, fixture);
        const { stakingRewardDistributor, ZUN, vlZUN, users, earlyExitReceiver } = fixture;

        // add ZUN token as reward token
        const tid3 = 2;
        await stakingRewardDistributor.addRewardToken(ZUN.address);

        await mine(BLOCKS_IN_4_MONTHS);

        // add RECAPITALIZATION_ROLE to user[2]
        await stakingRewardDistributor.grantRole(
            await stakingRewardDistributor.RECAPITALIZATION_ROLE(),
            users[2].address
        );

        // check balances before withdraw pool tokens
        expect(await ZUN.balanceOf(users[2].address)).to.eq(0);
        expect(await stakingRewardDistributor.recapitalizedAmounts(pid)).to.eq(0);

        // withdraw pool tokens from staking reward distributor
        const recapitalizeAmount = ethUnits(2500);
        await stakingRewardDistributor
            .connect(users[2])
            .withdrawPoolToken(ZUN.address, recapitalizeAmount);

        // check balances after withdraw pool tokens
        expect(await ZUN.balanceOf(users[2].address)).to.eq(recapitalizeAmount);
        expect(await stakingRewardDistributor.recapitalizedAmounts(pid)).to.eq(recapitalizeAmount);

        // try to withdraw whole deposit back
        const withdrawAmount = ethUnits(depositAmount1);
        await vlZUN.connect(users[0]).approve(stakingRewardDistributor.address, withdrawAmount);
        await stakingRewardDistributor.connect(users[0]).withdraw(pid, withdrawAmount);

        // check balances after withdraw
        const totalAmount = ethUnits(depositAmount1 + depositAmount2);
        const adjustedAmount = withdrawAmount
            .mul(totalAmount.sub(recapitalizeAmount).mul(ethUnits(1)).div(totalAmount))
            .div(ethUnits(1));
        expect(await vlZUN.balanceOf(users[0].address)).to.eq(0);
        expect(await ZUN.balanceOf(users[0].address)).to.eq(adjustedAmount);
        expect(await ZUN.balanceOf(users[2].address)).to.eq(recapitalizeAmount);
        expect(await ZUN.balanceOf(earlyExitReceiver.address)).to.eq(0);
        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(
            totalAmount.sub(adjustedAmount).sub(recapitalizeAmount)
        );
    });

    it('should distribute ZUN tokens', async () => {
        const {
            stakingRewardDistributor,
            ZUN,
            vlZUN,
            REWARD,
            REWARD2,
            admin,
            users,
            earlyExitReceiver,
        } = await loadFixture(deployFixture);

        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(ethUnits('0'));
        expect(await ZUN.balanceOf(admin.address)).to.eq(ethUnits('100000000'));
        expect(await ZUN.balanceOf(users[0].address)).to.eq(ethUnits('0'));
        expect(await vlZUN.balanceOf(users[0].address)).to.eq(ethUnits('0'));

        const tid1 = 0;
        await stakingRewardDistributor.addRewardToken(REWARD.address);

        const tid2 = 1;
        await stakingRewardDistributor.addRewardToken(REWARD2.address);

        const pid = 0;
        await stakingRewardDistributor.addPool(100, ZUN.address, vlZUN.address, false);

        await stakingRewardDistributor.grantRole(
            await stakingRewardDistributor.DISTRIBUTOR_ROLE(),
            admin.address
        );

        await ZUN.transfer(users[0].address, ethUnits('1000'));
        await ZUN.connect(users[0]).approve(stakingRewardDistributor.address, ethUnits('1000'));
        await stakingRewardDistributor.connect(users[0]).deposit(pid, ethUnits('1000'));
        expect(await vlZUN.balanceOf(users[0].address)).to.eq(ethUnits('1000'));

        await REWARD.approve(stakingRewardDistributor.address, ethUnits('100000000'));
        await stakingRewardDistributor.distribute(tid1, ethUnits('100000000'));

        await REWARD2.approve(stakingRewardDistributor.address, ethUnits('10000'));
        await stakingRewardDistributor.distribute(tid2, ethUnits('10000'));

        expect(await REWARD.balanceOf(stakingRewardDistributor.address)).to.eq(
            ethUnits('100000000')
        );
        expect(await REWARD2.balanceOf(stakingRewardDistributor.address)).to.eq(ethUnits('10000'));
        expect(await REWARD.balanceOf(users[0].address)).to.eq(ethUnits('0'));
        expect(await REWARD.balanceOf(users[1].address)).to.eq(ethUnits('0'));

        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(ethUnits('1000'));
        expect(await ZUN.balanceOf(admin.address)).to.eq(ethUnits('99999000'));
        expect(await ZUN.balanceOf(users[0].address)).to.eq(ethUnits('0'));

        // wait 1 week - 50_400 blocks
        await mine(50_400);

        await ZUN.transfer(users[1].address, ethUnits('1000'));
        await ZUN.connect(users[1]).approve(stakingRewardDistributor.address, ethUnits('1000'));
        await stakingRewardDistributor.connect(users[1]).deposit(pid, ethUnits('1000'));
        expect(await vlZUN.balanceOf(users[1].address)).to.eq(ethUnits('1000'));

        // wait 1 week - 50_400 blocks
        await mine(50_400);

        await stakingRewardDistributor.connect(users[1]).claim(tid1);
        await stakingRewardDistributor.connect(users[1]).claim(tid2);

        await stakingRewardDistributor.connect(users[0]).claim(tid1);
        await stakingRewardDistributor.connect(users[0]).claim(tid2);

        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(ethUnits('2000'));
        expect(await REWARD.balanceOf(users[1].address)).to.eq('24997519841269841000000000');
        expect(await REWARD2.balanceOf(users[1].address)).to.eq('2499851190476000000000');
        expect(await REWARD.balanceOf(users[0].address)).to.eq('75002480158730157000000000');
        expect(await REWARD2.balanceOf(users[0].address)).to.eq('7500148809523000000000');

        await stakingRewardDistributor.connect(users[1]).claim(tid1);
        await stakingRewardDistributor.connect(users[1]).claim(tid2);

        await stakingRewardDistributor.connect(users[0]).claim(tid1);
        await stakingRewardDistributor.connect(users[0]).claim(tid2);

        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(ethUnits('2000'));
        expect(await REWARD.balanceOf(users[0].address)).to.eq('75002480158730157000000000');
        expect(await REWARD2.balanceOf(users[0].address)).to.eq('7500148809523000000000');
        expect(await REWARD.balanceOf(users[1].address)).to.eq('24997519841269841000000000');
        expect(await REWARD2.balanceOf(users[1].address)).to.eq('2499851190476000000000');

        await vlZUN.connect(users[0]).approve(stakingRewardDistributor.address, ethUnits('500'));
        await stakingRewardDistributor.connect(users[0]).withdraw(pid, ethUnits('500'));

        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(ethUnits('1500'));
        expect(await ZUN.balanceOf(users[0].address)).to.eq(ethUnits('425'));
        expect(await ZUN.balanceOf(earlyExitReceiver.address)).to.eq(ethUnits('75'));

        await mine(50_400);

        await stakingRewardDistributor.connect(users[0]).claim(tid1);
        expect(await ZUN.balanceOf(stakingRewardDistributor.address)).to.eq(
            '1500000000000000000000'
        );
        expect(await REWARD.balanceOf(users[0].address)).to.eq('75002480158730157000000000');
        expect(await REWARD2.balanceOf(users[0].address)).to.eq('7500148809523000000000');
        expect(await REWARD.balanceOf(users[1].address)).to.eq('24997519841269841000000000');
        expect(await REWARD2.balanceOf(users[1].address)).to.eq('2499851190476000000000');
    });
});
