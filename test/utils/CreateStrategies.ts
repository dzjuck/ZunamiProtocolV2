import { GenericOracle, IStableConverter, ZunamiPool } from '../../typechain-types';
import { ethers } from 'hardhat';

async function deployStrategy(factory: ContractFactory, genericOracle: GenericOracle | undefined) {
    if (genericOracle) {
        return await factory.deploy(genericOracle.address);
    } else {
        return await factory.deploy();
    }
}

export async function createStrategies(
    strategyNames: string[],
    genericOracle: GenericOracle,
    zunamiPool: ZunamiPool,
    stableConverter: IStableConverter
) {
    const strategies = [];

    // Init all strategies
    for (const strategyName of strategyNames) {
        const factory = await ethers.getContractFactory(strategyName);
        const strategy = await deployStrategy(
            factory,
            strategyName.includes('Vault') ? undefined : genericOracle
        );

        await strategy.deployed();

        strategy.setZunamiPool(zunamiPool.address);

        if (strategyName.includes('CrvUsdStakeDaoCurve')) {
            strategy.setStableConverter(stableConverter.address);
        }

        strategies.push(strategy);
    }
    return strategies;
}
