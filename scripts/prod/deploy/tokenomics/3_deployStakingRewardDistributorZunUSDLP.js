const { ethers, upgrades } = require('hardhat');

async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const zunTokenAddress = '0x6b5204b0be36771253cc38e88012e02b752f0f36';

    // Zunami USD APS LP Staking

    const apsZunUSDControllerLP = '0xd9F559280c9d308549e84946C0d668a817fcCFB5';

    console.log('Deploy Zunami USD APS LP Staking:');
    const StakingRewardDistributorFactory = await ethers.getContractFactory(
        'StakingRewardDistributor'
    );

    const stakingRewardDistributor = await upgrades.deployProxy(
        StakingRewardDistributorFactory,
        [apsZunUSDControllerLP, 'Zunami USD APS LP Staking', 'stApsZunUSDLP', admin.address],
        {
            kind: 'uups',
        }
    );

    await stakingRewardDistributor.deployed();
    // const stakingRewardDistributor = StakingRewardDistributorFactory.attach('0x280D48e85F712e067A16D6b25e7fFe261c0810Bd');
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
