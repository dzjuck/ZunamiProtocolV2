const { ethers, upgrades} = require('hardhat');

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const zunAddress = '0xAc4d9e15910701a10329040bDC71a484C9Ba3860';
    const vlZunAddress = '0x036C922e67cE6E06a2F61765533d65162B8775b1';

    console.log('Deploy Staking Reward Distributor ZUN:');
    const StakingRewardDistributorFactory = await ethers.getContractFactory('StakingRewardDistributor');
    const stakingRewardDistributor = await upgrades.deployProxy(StakingRewardDistributorFactory, [], {
        kind: 'uups',
    });

    await stakingRewardDistributor.deployed();
    console.log('Staking Reward Distributor ZUN:', stakingRewardDistributor.address);

    await stakingRewardDistributor.setEarlyExitReceiver(admin.address);
    console.log('Early exit receiver set to: ', admin.address);

    const ZunamiVotingToken = await ethers.getContractFactory('ZunamiVotingToken');
    const vlZun = await ZunamiVotingToken.attach(vlZunAddress);
    await vlZun.deployed();

    await vlZun.grantRole(await vlZun.ISSUER_ROLE(), stakingRewardDistributor.address);
    console.log('Issuer role granted to Staking Reward Distributor ZUN');

    let tx = await stakingRewardDistributor.addRewardToken(zunAddress);
    await tx.wait();
    console.log('Reward token added: ', zunAddress);

    tx = await stakingRewardDistributor.addPool(100, zunAddress, vlZunAddress, false);
    await tx.wait();
    console.log('Pool added: ', 100, zunAddress, vlZunAddress, false);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
