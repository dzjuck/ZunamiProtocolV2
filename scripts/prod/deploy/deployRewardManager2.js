const { ethers } = require('hardhat');
const { IRewardManager } = require('../../../typechain-types');

async function main() {
    console.log('Start deploy');

    const tokenConverterAddress = '0xf48A59434609b6e934c2cF091848FA2D28b34bfc';
    const oracleAddress = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';

    console.log('Deploy SellingCurveRewardManager2:');
    const SellingCurveRewardManagerFactory = await ethers.getContractFactory(
        'SellingCurveRewardManager2'
    );
    const sellingCurveRewardManager = await SellingCurveRewardManagerFactory.deploy(
        tokenConverterAddress,
        oracleAddress
    );
    await sellingCurveRewardManager.deployed();
    console.log('SellingCurveRewardManager2:', sellingCurveRewardManager.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
