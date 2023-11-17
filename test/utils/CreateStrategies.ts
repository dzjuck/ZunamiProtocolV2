import {
    GenericOracle,
    INativeConverter,
    IStableConverter,
    ZunamiPool,
} from '../../typechain-types';
import { ethers } from 'hardhat';

async function deployStrategy(
    factory: ContractFactory,
    tokens: string[] | undefined,
    tokensDecimals: number[] | undefined
) {
    let strategy;
    if (tokens && tokensDecimals) {
        strategy = await factory.deploy(tokens, tokensDecimals);
    } else {
        strategy = await factory.deploy();
    }
    await strategy.deployed();
    return strategy;
}

export async function createStrategies(
    strategyNames: string[],
    genericOracle: GenericOracle,
    zunamiPool: ZunamiPool,
    stableConverter: IStableConverter,
    frxEthNativeConverter: INativeConverter | undefined,
    tokens: string[] | undefined,
    tokensDecimals: number[] | undefined
) {
    const strategies = [];

    // Init all strategies
    for (const strategyName of strategyNames) {
        console.log(strategyName);
        const factory = await ethers.getContractFactory(strategyName);
        const strategy = await deployStrategy(factory, tokens, tokensDecimals);

        await strategy.setZunamiPool(zunamiPool.address);

        if (!strategyName.includes('Vault')) {
            await strategy.setPriceOracle(genericOracle.address);
        }

        if (strategyName.includes('CrvUsdStakeDaoCurve')) {
          await strategy.setStableConverter(stableConverter.address);
        }

        if (strategyName.includes('frxETH') || strategyName.includes('stEth')) {
            await strategy.setNativeConverter(frxEthNativeConverter.address);
        }

        strategies.push(strategy);
    }
    return strategies;
}
