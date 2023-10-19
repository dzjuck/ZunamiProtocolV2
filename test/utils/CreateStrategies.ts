import { GenericOracle, StableConverter, ZunamiPool } from '../../typechain-types';
import { ethers } from 'hardhat';

export async function createStrategies(
    strategyNames: string[],
    genericOracle: GenericOracle,
    zunamiPool: ZunamiPool,
    stableConverter: StableConverter
) {
    const strategies = [];

    // Init all strategies
    for (const strategyName of strategyNames) {
        const factory = await ethers.getContractFactory(strategyName);
        const strategy = await factory.deploy(genericOracle.address);
        await strategy.deployed();

        strategy.setZunamiPool(zunamiPool.address);

        if (strategyName.includes('CrvUsdStakeDaoCurve')) {
            strategy.setStableConverter(stableConverter.address);
        }

        strategies.push(strategy);
    }
    return strategies;
}
