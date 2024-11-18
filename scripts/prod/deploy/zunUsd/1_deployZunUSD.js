const { ethers } = require('hardhat');

async function createAndInitStrategy(zunamiPool, stratName, oracle, tokenConverter) {
    const StratFactory = await ethers.getContractFactory(stratName);
    const strategy = await StratFactory.deploy();
    await strategy.deployed();
    console.log(`${stratName} strategy deployed to: ${strategy.address}`);

    if (!!oracle) {
        result = await strategy.setPriceOracle(oracle);
        await result.wait();
        console.log(`Set price oracle address ${oracle} in ${stratName} strategy`);
    }

    if (!!tokenConverter) {
        result = await strategy.setTokenConverter(tokenConverter.address);
        await result.wait();
        console.log(
            `Set token converter address ${tokenConverter.address} in ${stratName} strategy`
        );
    }

    // result = await zunamiPool.addStrategy(strategy.address);
    // await result.wait();
    // console.log(`Added ${stratName} pool to ZunamiPool`);

    result = await strategy.setZunamiPool(zunamiPool.address);
    await result.wait();
    console.log(`Set zunami pool address ${zunamiPool.address} in ${stratName} strategy`);
}

async function main() {
    console.log('Start deploy');

    const genericOracleAddr = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';

    console.log('Attach zunUSD omnipool:');
    const ZunamiPool = await ethers.getContractFactory('ZunamiPoolZunUSD');
    const zunamiPool = await ZunamiPool.attach('0x8C0D76C9B18779665475F3E212D9Ca1Ed6A1A0e6');
    // const zunamiPool = await ZunamiPool.deploy();
    // await zunamiPool.deployed();
    console.log('ZunamiPoolZunUSD:', zunamiPool.address);

    console.log('Attach zunUSD pool controller:');
    const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolControllerZunUSD');
    const zunamiPoolController = await ZunamiPoolController.attach(
        '0x2F858e4d6a96c81E37a130314D6cECB64FDC6f4E'
    );
    // const zunamiPoolController = await ZunamiPoolController.deploy(zunamiPool.address);
    // await zunamiPoolController.deployed();
    console.log('ZunamiPoolControllerZunUSD:', zunamiPoolController.address);

    // let result = await zunamiPool.grantRole(
    //     await zunamiPool.CONTROLLER_ROLE(),
    //     zunamiPoolController.address
    // );
    // await result.wait();
    // console.log(
    //     'ZunamiPoolController granted CONTROLLER_ROLE:',
    //     await zunamiPool.hasRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address)
    // );

    // await createAndInitStrategy(zunamiPool, 'ZunUSDVaultStrat', null, null);
    // await createAndInitStrategy(
    //     zunamiPool,
    //     'UsdcCrvUsdStakeDaoCurve',
    //     genericOracleAddr,
    //     stableConverter
    // );
    // await createAndInitStrategy(
    //     zunamiPool,
    //     'UsdtCrvUsdStakeDaoCurve',
    //     genericOracleAddr,
    //     stableConverter
    // );

    console.log('Attach TokenConverter:');
    const TokenConverterFactory = await ethers.getContractFactory('TokenConverter');
    const tokenConverter = await TokenConverterFactory.attach(
        '0xf48A59434609b6e934c2cF091848FA2D28b34bfc'
    );
    console.log('TokenConverter:', tokenConverter.address);

    // await createAndInitStrategy(
    //     zunamiPool,
    //     'LlamalendCrvStakeDaoERC4626Strat',
    //     genericOracleAddr,
    //     tokenConverter
    // );

    // await createAndInitStrategy(
    //     zunamiPool,
    //     'LlamalendWethStakeDaoERC4626Strat',
    //     genericOracleAddr,
    //     tokenConverter
    // );

    // await createAndInitStrategy(
    //     zunamiPool,
    //     'LlamalendWeth2StakeDaoERC4626Strat',
    //     genericOracleAddr,
    //     tokenConverter
    // );

    // await createAndInitStrategy(
    //     zunamiPool,
    //     'FraxCrvUsdStakeDaoCurve',
    //     genericOracleAddr,
    //     tokenConverter
    // );

    await createAndInitStrategy(
        zunamiPool,
        'scrvUsdERC4626Strat',
        genericOracleAddr,
        tokenConverter
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
