const { ethers } = require('hardhat');
const addresses = require("../../../test/address.json");
async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const zunAddr = '0x6b5204b0be36771253cc38e88012e02b752f0f36';
    console.log('ZUN address:', zunAddr);

    const vlZUN = '';
    const StakingRewardDistributor = await ethers.getContractFactory('ZUNStakingRewardDistributor');
    const stakingRewardDistributor = await StakingRewardDistributor.attach(vlZUN);
    console.log('ZUNStakingRewardDistributor:', stakingRewardDistributor.address);

    console.log('Deploy TimelockController:');
    const TimelockController = await ethers.getContractFactory('TimelockController');
    const timelockController = await TimelockController.deploy(
        172800, // 2 days
        [admin.address], // PROPOSERS
        [admin.address], // EXECUTOR
        admin.address
    );
    await timelockController.deployed();
    console.log('TimelockController:', timelockController.address);

    console.log('Deploy ZunamiGovernor:');
    const ZunamiGovernor = await ethers.getContractFactory('ZunamiGovernor');
    const zunamiGovernor = await ZunamiGovernor.deploy(vlZUN, timelockController.address);
    await zunamiGovernor.deployed();
    console.log('ZunamiGovernor:', zunamiGovernor.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
