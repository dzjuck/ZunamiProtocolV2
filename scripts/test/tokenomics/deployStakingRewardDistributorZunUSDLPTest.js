const { ethers, upgrades } = require('hardhat');

async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const zunTokenAddress = '0xAc4d9e15910701a10329040bDC71a484C9Ba3860';

    // Zunami USD APS LP Staking

    const apsZunUSDControllerLP = '0x8cB6a65076fdA549F1B893436ca437Aa8C906894';

    console.log('Deploy Zunami USD APS LP Staking:');
    const StakingRewardDistributorFactory = await ethers.getContractFactory(
        'StakingRewardDistributor'
    );

    const stakingRewardDistributor = await upgrades.deployProxy(
        StakingRewardDistributorFactory,
        [apsZunUSDControllerLP, 'Test Zunami USD APS LP Staking', 'tapsZunUSDLP-stk', admin.address],
        {
            kind: 'uups',
        }
    );

    await stakingRewardDistributor.deployed();
    console.log('Staking Reward Distributor LP:', stakingRewardDistributor.address);

    tx = await stakingRewardDistributor.addRewardToken(zunTokenAddress);
    await tx.wait();
    console.log('Reward token added: ', zunTokenAddress);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
