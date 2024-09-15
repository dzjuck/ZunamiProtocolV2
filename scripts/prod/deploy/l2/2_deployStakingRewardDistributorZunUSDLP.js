const { ethers, upgrades } = require('hardhat');

async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const zunTokenAddress = '0x1db0Fc8933f545648b54A9eE4326209a9A259643';

    // Zunami USD APS LP Staking

    const apsZunUSDControllerLP = '0x65363f1A6cb67fE045bbD2fb3c5cb81bFBEe7902';

    console.log('Deploy Base Locked Zunami USD APS LP Staking:');
    const StakingRewardDistributorFactory = await ethers.getContractFactory(
        'LockedStakingRewardDistributor'
    );

    const stakingRewardDistributor = await upgrades.deployProxy(
        StakingRewardDistributorFactory,
        [apsZunUSDControllerLP, 'Rewarded Zunami Staked USD APS LP', 'zunStakedUSD', admin.address],
        {
            kind: 'uups',
        }
    );

    await stakingRewardDistributor.deployed();
    // const stakingRewardDistributor = StakingRewardDistributorFactory.attach('');
    console.log('Staking Reward Distributor LP:', stakingRewardDistributor.address);

    const tx = await stakingRewardDistributor.addRewardToken(zunTokenAddress);
    await tx.wait();
    console.log('Reward token added: ', zunTokenAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
