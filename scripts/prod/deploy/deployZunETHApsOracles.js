const { ethers } = require('hardhat');
const { GenericOracle } = require('../../../typechain-types');
const {
    attachPoolAndControllerZunUSD,
} = require('../../../test/utils/AttachPoolAndControllerZunUSD');
const addresses = require("../../../test/address.json");

async function main() {
    console.log('Start deploy');

    const genericOracleAddress = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
    const GenericOracleFactory = await ethers.getContractFactory('GenericOracle');
    const genericOracle = await GenericOracleFactory.attach(genericOracleAddress);
    console.log('GenericOracle attached to:', genericOracle.address);

    const zunETHAddress = '0xc2e660C62F72c2ad35AcE6DB78a616215E2F2222';
    //
    // const ZunEthOracleFactory = await ethers.getContractFactory('ZunEthOracle');
    // const zunEthOracle = await ZunEthOracleFactory.deploy(genericOracleAddress);
    // await zunEthOracle.deployed();
    // console.log('ZunEthOracle deployed to:', zunEthOracle.address);
    //
    // await genericOracle.setCustomOracle(zunETHAddress, zunEthOracle.address);
    // console.log('ZunEth oracle set: ', zunETHAddress, zunEthOracle.address);
    //
    // const ZUNFRXETHPoolAddress = '0x3A65cbaebBFecbeA5D0CB523ab56fDbda7fF9aAA';

    const StaticCurveLPOracleFactory = await ethers.getContractFactory('StaticCurveLPOracle');
    // const staticCurveLPOracle = await StaticCurveLPOracleFactory.deploy(
    //     genericOracleAddress,
    //     [zunETHAddress, addresses.crypto.frxETH],
    //     [18, 18],
    //     ZUNFRXETHPoolAddress
    // );
    // await staticCurveLPOracle.deployed();
    // console.log('StaticCurveLPOracle deployed to:', staticCurveLPOracle.address);
    //
    // await genericOracle.setCustomOracle(ZUNFRXETHPoolAddress, staticCurveLPOracle.address);
    // console.log('Static oracle set: ', ZUNFRXETHPoolAddress, staticCurveLPOracle.address);

    const ZUNPXETHPoolAddress = '0x17D964DA2bD337CfEaEd30a27c9Ab6580676E730';
    const staticCurveLPOracle = await StaticCurveLPOracleFactory.deploy(
        genericOracleAddress,
        [zunETHAddress, addresses.crypto.pxETH],
        [18, 18],
        ZUNPXETHPoolAddress
    );
    await staticCurveLPOracle.deployed();
    console.log('ZUNPXETHPool StaticCurveLPOracle deployed to:', staticCurveLPOracle.address);

    await genericOracle.setCustomOracle(ZUNPXETHPoolAddress, staticCurveLPOracle.address);
    console.log('Static oracle set: ', ZUNPXETHPoolAddress, staticCurveLPOracle.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
