const { ethers, upgrades } = require('hardhat');

async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const zunTokenAddress = '0x6b5204b0be36771253cc38e88012e02b752f0f36';

    // Zunami USD APS LP Staking

    const apsZunETHControllerLP = '0xD8132d8cfCA9Ed8C95e46Cb59ae6E2C9963dA61f';

    console.log('Deploy Zunami ETH APS LP Staking:');
    const StakingRewardDistributorFactory = await ethers.getContractFactory(
        'StakingRewardDistributor'
    );

    const stakingRewardDistributor = await upgrades.deployProxy(
        StakingRewardDistributorFactory,
        [apsZunETHControllerLP, 'Zunami ETH APS LP Staking', 'stApsZunETHLP', admin.address],
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
