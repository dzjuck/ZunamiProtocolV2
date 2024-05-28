const { ethers } = require('hardhat');
const fs = require("fs");

async function deployVesting(csvPath, admin, startTimestamp, durationSeconds, tokenAddress) {
    console.log('Deploying Vesting:');
    console.log('Recipients CSV path:', csvPath);
    console.log('Start timestamp:', startTimestamp);
    console.log('Duration seconds:', durationSeconds);
    console.log('ZUN token address:', tokenAddress);
    console.log('Admin address:', admin.address);

    const csvData = fs.readFileSync(csvPath, 'utf8')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

    const recipients = csvData.map(record => record.split(',')[0]);
    console.log('Recipients:', recipients);
    const allocations = csvData.map(record => ethers.utils.parseUnits(record.split(',')[1],"ether").toString());
    console.log('Allocations:', allocations);

    const ZunVestingDistributor = await ethers.getContractFactory('ZunVestingDistributor', admin);

    // Deploy Ambassadors Vesting
    const vesting = await ZunVestingDistributor.deploy(
        recipients,
        allocations,
        startTimestamp,
        durationSeconds,
        tokenAddress,
        admin.address
    );
    await vesting.deployed();
    console.log('Vesting deployed to:', vesting.address)
    console.log('Total Allocation: ', (await vesting.totalAllocation()).toString());
    console.log(' ');
}

module.exports = {
    deployVesting
};
