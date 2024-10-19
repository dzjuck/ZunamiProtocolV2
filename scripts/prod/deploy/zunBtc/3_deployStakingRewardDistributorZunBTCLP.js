const { ethers, upgrades } = require('hardhat');

async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const zunTokenAddress = '0x6b5204B0Be36771253Cc38e88012E02B752f0f36';

    // Zunami BTC APS LP Staking

    const apsZunBTCControllerLP = '0xAEa5f929bC26Dea0c3f5d6dcb0e00ce83751Fc41';

    console.log('Deploy Zunami BTC APS LP Staking:');
    const StakingRewardDistributorFactory = await ethers.getContractFactory(
        'StakingRewardDistributor'
    );
    // const stakingRewardDistributor = StakingRewardDistributorFactory.attach("")
    const stakingRewardDistributor = await upgrades.deployProxy(
        StakingRewardDistributorFactory,
        [apsZunBTCControllerLP, 'Zunami BTC APS LP Staking', 'stApsZunBTCLP', admin.address],
        {
            kind: 'uups',
        }
    );

    await stakingRewardDistributor.deployed();
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
