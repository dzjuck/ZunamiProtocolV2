const { ethers } = require('hardhat');
const { GenericOracle } = require('../../../typechain-types');
const {
    attachPoolAndControllerZunUSD,
} = require('../../../test/utils/AttachPoolAndControllerZunUSD');

async function main() {
    console.log('Start deploy');

    const genericOracleAddress = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
    const GenericOracleFactory = await ethers.getContractFactory('GenericOracle');
    const genericOracle = await GenericOracleFactory.attach(genericOracleAddress);
    console.log('GenericOracle attached to:', genericOracle.address);

    const frxETHAddress = '0x5E8422345238F34275888049021821E8E08CAa1f';

    const FrxETHOracleFactory = await ethers.getContractFactory('FrxETHOracle');
    const frxETHOracle = await FrxETHOracleFactory.deploy(genericOracleAddress);
    await frxETHOracle.deployed();
    console.log('FrxETHOracle deployed to:', frxETHOracle.address);

    await genericOracle.setCustomOracle(frxETHAddress, frxETHOracle.address);
    console.log('FrxETH oracle set: ', frxETHAddress, frxETHOracle.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
