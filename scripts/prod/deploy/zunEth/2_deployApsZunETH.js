const { ethers } = require('hardhat');

async function createAndInitStrategy(zunamiPool, stratName, oracleAddress, tokenConverterAddress) {
    const StratFactory = await ethers.getContractFactory(stratName);
    const strategy = await StratFactory.deploy();
    await strategy.deployed();
    console.log(`${stratName} strategy deployed to: ${strategy.address}`);

    if (!!oracleAddress) {
        result = await strategy.setPriceOracle(oracleAddress);
        await result.wait();
        console.log(`Set price oracle address ${oracleAddress} in ${stratName} strategy`);
    }

    if (!!tokenConverterAddress) {
        result = await strategy.setTokenConverter(tokenConverterAddress);
        await result.wait();
        console.log(
            `Set token converter address ${tokenConverterAddress} in ${stratName} strategy`
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

    console.log('Deploy zunETH APS omnipool:');
    const ZunamiPool = await ethers.getContractFactory('ZunamiPoolApsZunETH');
    const zunamiPool = await ZunamiPool.attach('0x5Ab3aa11a40eB34f1d2733f08596532871bd28e2');
    // const zunamiPool = await ZunamiPool.deploy();
    // await zunamiPool.deployed();
    console.log('ZunamiPoolApsZunETH:', zunamiPool.address);

    // console.log('Deploy zunETH APS pool controller:');
    // const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolControllerApsZunETH');
    // const zunamiPoolController = await ZunamiPoolController.deploy(zunamiPool.address);
    // await zunamiPoolController.deployed();
    // console.log('ZunamiPoolControllerApsZunETH:', zunamiPoolController.address);
    //
    // let result = await zunamiPool.grantRole(
    //     await zunamiPool.CONTROLLER_ROLE(),
    //     zunamiPoolController.address
    // );
    // await result.wait();
    // console.log(
    //     'ZunamiPoolController granted CONTROLLER_ROLE:',
    //     await zunamiPool.hasRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address)
    // );

    // await createAndInitStrategy(zunamiPool, 'ZunETHApsVaultStrat', null, null);

    const genericOracleAddress = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
    const tokenConverterAddress = '0xf48A59434609b6e934c2cF091848FA2D28b34bfc';

    // await createAndInitStrategy(
    //     zunamiPool,
    //     'ZunEthFrxEthApsStakeDaoCurveStrat',
    //     genericOracleAddress,
    //     tokenConverterAddress
    // );
    //
    // await createAndInitStrategy(
    //     zunamiPool,
    //     'ZunEthFrxEthApsStakingConvexCurveStrat',
    //     genericOracleAddress,
    //     tokenConverterAddress
    // );

    await createAndInitStrategy(
        zunamiPool,
        'ZunEthPxEthApsStakeDaoCurveStrat',
        genericOracleAddress,
        tokenConverterAddress
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
