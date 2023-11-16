const { ethers } = require('hardhat');

async function createAndInitConicOracles(curvePools) {
    const CurveRegistryCacheFactory = await ethers.getContractFactory('CurveRegistryCache');
    const curveRegistryCache = await CurveRegistryCacheFactory.deploy();

    const ChainlinkOracleFactory = await ethers.getContractFactory('ChainlinkOracle');
    const chainlinkOracle = await ChainlinkOracleFactory.deploy();

    const GenericOracleFactory = await ethers.getContractFactory('GenericOracle');
    const genericOracle = await GenericOracleFactory.deploy();

    const CurveLPOracleFactory = await ethers.getContractFactory('CurveLPOracle');
    const curveLPOracle = await CurveLPOracleFactory.deploy(
        genericOracle.address,
        curveRegistryCache.address
    );

    await genericOracle.initialize(curveLPOracle.address, chainlinkOracle.address);

    for (const curvePool of curvePools) {
        await curveRegistryCache.initPool(curvePool);
    }

    return { curveRegistryCache, chainlinkOracle, genericOracle, curveLPOracle };
}

return createAndInitConicOracles;
