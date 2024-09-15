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

    // const crvUsdAddress = '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E';
    //
    // const CrvUsdOracleFactory = await ethers.getContractFactory('CrvUsdOracle');
    // const crvUsdOracle = await CrvUsdOracleFactory.deploy(genericOracleAddress);
    // await crvUsdOracle.deployed();
    // console.log('CrvUsdOracle deployed to:', crvUsdOracle.address);
    //
    // await genericOracle.setCustomOracle(crvUsdAddress, crvUsdOracle.address);
    // console.log('CrvUsd oracle set: ', crvUsdAddress, crvUsdOracle.address);

    const zunUSDAddress = '0x8C0D76C9B18779665475F3E212D9Ca1Ed6A1A0e6';
    //
    // const ZunUsdOracleFactory = await ethers.getContractFactory('ZunUsdOracle');
    // const zunUsdOracle = await ZunUsdOracleFactory.deploy(genericOracleAddress);
    // await zunUsdOracle.deployed();
    // console.log('ZunUsdOracle deployed to:', zunUsdOracle.address);
    //
    // await genericOracle.setCustomOracle(zunUSDAddress, zunUsdOracle.address);
    // console.log('ZunUsd oracle set: ', zunUSDAddress, zunUsdOracle.address);
    //
    // const CRVZUNUSDPoolAddress = '0x8c24b3213fd851db80245fccc42c40b94ac9a745';
    //
    const StaticCurveLPOracleFactory = await ethers.getContractFactory('StaticCurveLPOracle');
    // const staticCurveLPOracle = await StaticCurveLPOracleFactory.deploy(
    //     genericOracleAddress,
    //     [crvUsdAddress, zunUSDAddress],
    //     [18, 18],
    //     CRVZUNUSDPoolAddress
    // );
    // await staticCurveLPOracle.deployed();
    //
    // await genericOracle.setCustomOracle(CRVZUNUSDPoolAddress, staticCurveLPOracle.address);
    // console.log('Static oracle set: ', CRVZUNUSDPoolAddress, staticCurveLPOracle.address);

    // const fxUSDAddress = '0x085780639CC2cACd35E474e71f4d000e2405d8f6';
    // const FxUsdOracleFactory = await ethers.getContractFactory('FxUsdOracle');
    // const fxUsdOracle = await FxUsdOracleFactory.deploy(genericOracleAddress);
    // await fxUsdOracle.deployed();
    //
    // await genericOracle.setCustomOracle(fxUSDAddress, fxUsdOracle.address);
    // console.log('Static oracle set: ', fxUSDAddress, fxUsdOracle.address);

    //
    // const ZUNUSDFXUSDPoolAddress = '0x13eA95Ce68185e334d3747539845A3b7643a8cab';
    //
    // const staticCurveLPOracle = await StaticCurveLPOracleFactory.deploy(
    //     genericOracleAddress,
    //     [zunUSDAddress, fxUSDAddress],
    //     [18, 18],
    //     ZUNUSDFXUSDPoolAddress
    // );
    // await staticCurveLPOracle.deployed();
    //
    // await genericOracle.setCustomOracle(ZUNUSDFXUSDPoolAddress, staticCurveLPOracle.address);
    // console.log('Static oracle set: ', ZUNUSDFXUSDPoolAddress, staticCurveLPOracle.address);

    const FXN_ADDR = '0x365accfca291e7d3914637abf1f7635db165bb09';
    const FxnOracleFactory = await ethers.getContractFactory('FxnOracle');
    const fxnOracle = await FxnOracleFactory.deploy(genericOracle.address);
    console.log('FxnOracle deployed to: ', fxnOracle.address);

    await genericOracle.setCustomOracle(FXN_ADDR, fxnOracle.address);
    console.log('Fxn oracle set: ', FXN_ADDR, fxnOracle.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
