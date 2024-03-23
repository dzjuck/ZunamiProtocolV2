const { ethers, upgrades } = require('hardhat');

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const zunAddress = '';
    const apsLPAddress = '';

    console.log('Deploy Staking Reward Distributor LP:');
    const StakingRewardDistributorFactory = await ethers.getContractFactory(
        'StakingRewardDistributor'
    );
    const stakingRewardDistributor = await upgrades.deployProxy(
        StakingRewardDistributorFactory,
        [],
        {
            kind: 'uups',
        }
    );

    await stakingRewardDistributor.deployed();
    console.log('Staking Reward Distributor LP:', stakingRewardDistributor.address);

    let tx = await stakingRewardDistributor.addRewardToken(zunAddress);
    await tx.wait();
    console.log('Reward token added: ', zunAddress);

    tx = await stakingRewardDistributor.addPool(100, apsLPAddress, ADDRESS_ZERO, false);
    await tx.wait();
    console.log('Pool added: ', 100, apsLPAddress, ADDRESS_ZERO, false);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
