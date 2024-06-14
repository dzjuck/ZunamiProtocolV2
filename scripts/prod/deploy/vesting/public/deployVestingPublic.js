const { ethers } = require('hardhat');
const {deployVesting} = require("../deployVesting");

async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const zunTokenAddress = "0x6b5204b0be36771253cc38e88012e02b752f0f36";

    const startTimestamp = 1716984000; // 2024-05-29 12:00:00 UTC

    const durationSecondsUnlocked = 0; // unlocked
    const durationSecondsYear = 365 * 24 * 60 * 60; // 1 year

    const ambassadorsCsvPath = './scripts/prod/deploy/vesting/public/ambassadors.csv';
    const compensationFirstCsvPath = './scripts/prod/deploy/vesting/public/compensation_first.csv';
    const compensationSecondCsvPath = './scripts/prod/deploy/vesting/public/compensation_second.csv';
    const compensationSecondZethCsvPath = './scripts/prod/deploy/vesting/public/compensation_second_zeth.csv';

    // await deployVesting(ambassadorsCsvPath, admin, startTimestamp, durationSecondsUnlocked, zunTokenAddress);
    //
    // await deployVesting(compensationFirstCsvPath, admin, startTimestamp, durationSecondsUnlocked, zunTokenAddress);
    //
    // await deployVesting(compensationSecondCsvPath, admin, startTimestamp, durationSecondsYear, zunTokenAddress);
    //
    // await deployVesting(compensationSecondZethCsvPath, admin, startTimestamp, durationSecondsYear, zunTokenAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
