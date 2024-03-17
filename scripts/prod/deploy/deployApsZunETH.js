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
        result = await strategy.setStableConverter(tokenConverterAddress);
        await result.wait();
        console.log(
            `Set stable converter address ${tokenConverterAddress} in ${stratName} strategy`
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
    const zunamiPool = await ZunamiPool.deploy();
    await zunamiPool.deployed();
    console.log('ZunamiPoolApszunETH:', zunamiPool.address);

    console.log('Deploy zunETH APS pool controller:');
    const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolControllerApsZunETH');
    const zunamiPoolController = await ZunamiPoolController.deploy(zunamiPool.address);
    await zunamiPoolController.deployed();
    console.log('ZunamiPoolControllerApsZunETH:', zunamiPoolController.address);

    let result = await zunamiPool.grantRole(
        await zunamiPool.CONTROLLER_ROLE(),
        zunamiPoolController.address
    );
    await result.wait();
    console.log(
        'ZunamiPoolController granted CONTROLLER_ROLE:',
        await zunamiPool.hasRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address)
    );
    await createAndInitStrategy(zunamiPool, 'ZunETHApsVaultStrat', null, null);

    // const genericOracleAddress = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
    // const stableConverterAddress = '0x0236B7A3996d8c3597173aA95fD2a915c7A8A42E';
    // await createAndInitStrategy(
    //     zunamiPool,
    //     'zunETHCrvUsdApsConvexCurveStrat',
    //     genericOracleAddress,
    //     stableConverterAddress
    // );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
