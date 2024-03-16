const { ethers } = require('hardhat');
const {IRewardManager} = require("../../../typechain-types");

async function main() {
    console.log('Start deploy');

    console.log('Deploy StableConverter:');
    const StableConverterFactory = await ethers.getContractFactory('StableConverter');
    const stableConverter = await StableConverterFactory.deploy();
    await stableConverter.deployed();
    console.log('StableConverter:', stableConverter.address);

    console.log('Deploy SellingCurveRewardManager:');
    const SellingCurveRewardManagerFactory = await ethers.getContractFactory('SellingCurveRewardManager');
    const sellingCurveRewardManager = await SellingCurveRewardManagerFactory.deploy(stableConverter.address);
    await sellingCurveRewardManager.deployed();
    console.log('SellingCurveRewardManager:', sellingCurveRewardManager.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
