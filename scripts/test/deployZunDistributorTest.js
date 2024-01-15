const { ethers } = require('hardhat');
async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const zunTokenAddress = '';
    const zunVoteTokenAddress = '';

    const rewardDistributorAddress = '';
    const zunTokenRewardDistributorTid  = 0;

    console.log('Deploy StakingRewardDistributorGauge:');
    const StakingRewardDistributorGauge = await ethers.getContractFactory('StakingRewardDistributorGauge');
    const gauge = await StakingRewardDistributorGauge.deploy(
        zunTokenAddress,
        rewardDistributorAddress,
        zunTokenRewardDistributorTid
    );
    await gauge.deployed();
    console.log('StakingRewardDistributorGauge:', gauge.address);

    // get current block number
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log('Deploy ZunDistributor:');
    const ZunDistributor = await ethers.getContractFactory('ZunDistributor');
    const distributor = await ZunDistributor.deploy(
        zunTokenAddress,
        zunVoteTokenAddress,
        admin.address,
        blockNumber,
        [gauge.address],
        [ethers.utils.parseEther('100')]
    );
    await distributor.deployed();
    console.log('ZunDistributor:', distributor.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
