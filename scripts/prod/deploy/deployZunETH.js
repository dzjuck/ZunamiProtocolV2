const { ethers } = require('hardhat');

async function createAndInitStrategy(zunamiPool, stratName, oracle, nativeConverter) {
    const StratFactory = await ethers.getContractFactory(stratName);
    const strategy = await StratFactory.deploy();
    await strategy.deployed();
    console.log(`${stratName} strategy deployed to: ${strategy.address}`);

    if (!!oracle) {
        result = await strategy.setPriceOracle(oracle);
        await result.wait();
        console.log(`Set price oracle address ${oracle} in ${stratName} strategy`);
    }

    if (!!nativeConverter) {
        result = await strategy.setNativeConverter(nativeConverter.address);
        await result.wait();
        console.log(
            `Set native converter address ${nativeConverter.address} in ${stratName} strategy`
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

    console.log('Deploy NativeConverter:');
    const NativeConverterFactory = await ethers.getContractFactory('FraxEthNativeConverter');
    const nativeConverter = await NativeConverterFactory.deploy();
    await nativeConverter.deployed();
    console.log('FraxEthNativeConverter:', nativeConverter.address);

    console.log('Deploy zunETH omnipool:');
    const ZunamiPool = await ethers.getContractFactory('ZunamiPoolZunETH');
    const zunamiPool = await ZunamiPool.deploy();
    await zunamiPool.deployed();
    console.log('ZunamiPoolZunETH:', zunamiPool.address);

    console.log('Deploy zunETH pool controller:');
    const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolControllerZunETH');
    const zunamiPoolController = await ZunamiPoolController.deploy(zunamiPool.address);
    await zunamiPoolController.deployed();
    console.log('ZunamiPoolControllerZunETH:', zunamiPoolController.address);

    let result = await zunamiPool.grantRole(
        await zunamiPool.CONTROLLER_ROLE(),
        zunamiPoolController.address
    );
    await result.wait();
    console.log(
        'ZunamiPoolController granted CONTROLLER_ROLE:',
        await zunamiPool.hasRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address)
    );

    await createAndInitStrategy(zunamiPool, 'ZunETHVaultStrat', null, null);
    await createAndInitStrategy(
        zunamiPool,
        'stEthEthConvexCurveStrat',
        genericOracleAddr,
        nativeConverter
    );
    await createAndInitStrategy(
        zunamiPool,
        'sfrxETHERC4626Strat',
        genericOracleAddr,
        nativeConverter
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
