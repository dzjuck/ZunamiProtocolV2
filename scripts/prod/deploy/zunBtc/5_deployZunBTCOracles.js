const { ethers } = require('hardhat');

async function main() {
    console.log('Start deploy');

    const genericOracleAddress = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
    const GenericOracleFactory = await ethers.getContractFactory('GenericOracle');
    const genericOracle = await GenericOracleFactory.attach(genericOracleAddress);
    console.log('GenericOracle attached to:', genericOracle.address);

    const curveRegistryCacheAddress = '0x2E68bE71687469280319BCf9E635a8783Db5d238';
    const CurveRegistryCacheFactory = await ethers.getContractFactory('CurveRegistryCache');
    const curveRegistryCache = await CurveRegistryCacheFactory.attach(curveRegistryCacheAddress);
    console.log('CurveRegistryCache attached to:', curveRegistryCache.address);

    const wBtcTBtcPoolAddr = "0xB7ECB2AA52AA64a717180E030241bC75Cd946726";
    await curveRegistryCache.initPool(wBtcTBtcPoolAddr);
    console.log('CurveRegistryCache initialized with: ', wBtcTBtcPoolAddr);

    const LlammaOracleFactory = await ethers.getContractFactory('LlammaOracle');

    const wBtc = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    const wBtcLlammaOracle = "0xBe83fD842DB4937C0C3d15B2aBA6AF7E854f8dcb";
    const wBTCOracle = await LlammaOracleFactory.deploy(wBtcLlammaOracle, wBtc);
    console.log('wBtc Llamma Oracle deployed to:', wBTCOracle.address);
    await genericOracle.setCustomOracle(wBtc, wBTCOracle.address);
    console.log('wBtc Llamma Oracle set to GenericOracle');

    const tBtc = "0x18084fbA666a33d37592fA2633fD49a74DD93a88";
    const tBtcLlammaOracle = "0xbeF434E2aCF0FBaD1f0579d2376fED0d1CfC4217";
    const tBTCOracle = await LlammaOracleFactory.deploy(tBtcLlammaOracle, tBtc);
    console.log('tBtc Llamma Oracle deployed to:', tBTCOracle.address);
    await genericOracle.setCustomOracle(tBtc, tBTCOracle.address);
    console.log('tBtc Llamma Oracle set to GenericOracle');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
