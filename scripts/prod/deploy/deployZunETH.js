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

    console.log('Deploy TokenConverter:');
    const TokenConverterFactory = await ethers.getContractFactory('TokenConverter');
    // const tokenConverter = await TokenConverterFactory.deploy();
    // await tokenConverter.deployed();
    const tokenConverter = await TokenConverterFactory.attach("0xf48A59434609b6e934c2cF091848FA2D28b34bfc");
    console.log('TokenConverter:', tokenConverter.address);

    console.log('Deploy zunETH omnipool:');
    const ZunamiPool = await ethers.getContractFactory('ZunamiPoolZunETH');
    // const zunamiPool = await ZunamiPool.deploy();
    // await zunamiPool.deployed();
    const zunamiPool = await ZunamiPool.attach("0xc2e660C62F72c2ad35AcE6DB78a616215E2F2222");
    console.log('ZunamiPoolZunETH:', zunamiPool.address);

    // console.log('Deploy zunETH pool controller:');
    // const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolControllerZunETH');
    // const zunamiPoolController = await ZunamiPoolController.deploy(zunamiPool.address);
    // await zunamiPoolController.deployed();
    // console.log('ZunamiPoolControllerZunETH:', zunamiPoolController.address);
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

    // await createAndInitStrategy(zunamiPool, 'ZunETHVaultStrat', null, null);
    await createAndInitStrategy(
        zunamiPool,
        'stEthEthConvexCurveStrat',
        genericOracleAddr,
        tokenConverter
    );
    await createAndInitStrategy(
        zunamiPool,
        'sfrxETHERC4626Strat',
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
