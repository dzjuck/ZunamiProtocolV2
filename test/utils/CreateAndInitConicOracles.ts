import { ethers } from 'hardhat';
import {
    ChainlinkOracle,
    CurveLPOracle,
    CurveRegistryCache,
    GenericOracle,
} from '../../typechain-types';

export async function createAndInitConicOracles(curvePools: string[]) {
    const CurveRegistryCacheFactory = await ethers.getContractFactory('CurveRegistryCache');
    const curveRegistryCache = (await CurveRegistryCacheFactory.deploy()) as CurveRegistryCache;

    const ChainlinkOracleFactory = await ethers.getContractFactory('ChainlinkOracle');
    const chainlinkOracle = (await ChainlinkOracleFactory.deploy()) as ChainlinkOracle;

    const GenericOracleFactory = await ethers.getContractFactory('GenericOracle');
    const genericOracle = (await GenericOracleFactory.deploy()) as GenericOracle;

    const FrxETHOracleFactory = await ethers.getContractFactory('FrxETHOracle');
    const frxETHOracle = await FrxETHOracleFactory.deploy(genericOracle.address);

    const FRX_ETH_ADDRESS = '0x5E8422345238F34275888049021821E8E08CAa1f';
    await genericOracle.setCustomOracle(FRX_ETH_ADDRESS, frxETHOracle.address);

    const CurveLPOracleFactory = await ethers.getContractFactory('CurveLPOracle');
    const curveLPOracle = (await CurveLPOracleFactory.deploy(
        genericOracle.address,
        curveRegistryCache.address
    )) as CurveLPOracle;

    await genericOracle.initialize(curveLPOracle.address, chainlinkOracle.address);

    for (const curvePool of curvePools) {
        await curveRegistryCache.initPool(curvePool);
    }

    return { curveRegistryCache, chainlinkOracle, genericOracle, curveLPOracle };
}
