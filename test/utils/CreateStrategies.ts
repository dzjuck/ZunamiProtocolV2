import {
    GenericOracle,
    INativeConverter,
    IStableConverter,
    ITokenConverter,
    ZunamiPool,
} from '../../typechain-types';
import { ethers } from 'hardhat';
import { ContractFactory } from 'ethers';

async function deployStrategy(
    strategyName: string,
    factory: ContractFactory,
    tokens: string[] | undefined,
    tokensDecimals: number[] | undefined
) {
    let strategy;
    if (strategyName == 'VaultStrat' && tokens && tokensDecimals) {
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
    stableConverter: IStableConverter | undefined,
    tokenConverter: ITokenConverter | undefined,
    tokens: string[] | undefined,
    tokensDecimals: number[] | undefined
) {
    const strategies = [];

    // Init all strategies
    for (const strategyName of strategyNames) {
        const factory = await ethers.getContractFactory(strategyName);
        const strategy = await deployStrategy(strategyName, factory, tokens, tokensDecimals);

        await strategy.setZunamiPool(zunamiPool.address);

        if (!strategyName.includes('Vault')) {
            await strategy.setPriceOracle(genericOracle.address);
        }

        if (
            (tokenConverter && strategyName.includes('LlamalendCrvUsdStakeDaoERC4626Strat')) ||
            (tokenConverter && strategyName.includes('LlamalendCrvUsdConvexERC4626Strat')) ||
            (tokenConverter && strategyName.includes('sfrxETHERC4626Strat')) ||
            (tokenConverter && strategyName.includes('stEthEthConvexCurveStrat')) ||
            (tokenConverter && strategyName.includes('ZunEthFrxEthApsConvexCurveStrat')) ||
            (tokenConverter && strategyName.includes('pxETHwETHStakeDaoCurveNStrat')) ||
            (tokenConverter && strategyName.includes('ZunEthFrxEthApsStakeDaoCurveStrat')) ||
            (tokenConverter && strategyName.includes('ZunEthFrxEthApsStakingConvexCurveStrat'))
        ) {
            await strategy.setTokenConverter(tokenConverter.address);
        }

        if (
            (stableConverter && strategyName.includes('ZunUsdCrvUsdApsConvexCurveStrat')) ||
            (stableConverter && strategyName.includes('UsdtCrvUsdStakeDaoCurve')) ||
            (stableConverter && strategyName.includes('UsdcCrvUsdStakeDaoCurve'))
        ) {
            await strategy.setStableConverter(stableConverter.address);
        }

        strategies.push(strategy);
    }
    return strategies;
}
