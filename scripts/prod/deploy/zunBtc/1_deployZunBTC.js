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

    // console.log('Deploy TokenConverter:');
    const TokenConverterFactory = await ethers.getContractFactory('TokenConverter');
    // const tokenConverter = await TokenConverterFactory.deploy();
    // await tokenConverter.deployed();
    const tokenConverter = await TokenConverterFactory.attach(
        '0xf48A59434609b6e934c2cF091848FA2D28b34bfc'
    );
    console.log('TokenConverter:', tokenConverter.address);

    console.log('Deploy zunBTC omnipool:');
    const ZunamiPool = await ethers.getContractFactory('ZunamiPoolZunBTC');
    // const zunamiPool = await ZunamiPool.deploy();
    // await zunamiPool.deployed();
    const zunamiPool = await ZunamiPool.attach('0x390FF6Bff315aC514F1De8480ed6666a3B5095A7');
    console.log('ZunamiPoolZunBTC:', zunamiPool.address);

    console.log('Deploy zunBTC pool controller:');
    const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolControllerZunBTC');
    // const zunamiPoolController = await ZunamiPoolController.deploy(zunamiPool.address);
    // await zunamiPoolController.deployed();
    const zunamiPoolController = await ZunamiPool.attach('0x8cA9f8A82F3561915f0A7f16c16e3F08fB71588d');
    console.log('ZunamiPoolControllerZunBTC:', zunamiPoolController.address);

    // let result = await zunamiPool.grantRole(
    //     await zunamiPool.CONTROLLER_ROLE(),
    //     zunamiPoolController.address
    // );
    // await result.wait();
    // console.log(
    //     'ZunamiPoolController granted CONTROLLER_ROLE:',
    //     await zunamiPool.hasRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address)
    // );

    // await createAndInitStrategy(zunamiPool, 'ZunBTCVaultStrat', null, null);
    result = await zunamiPool.addStrategy('0x43beaC29c2F9Cd10F936068925cf69FF273453b5');
    await result.wait();
    console.log(`Added ZunBTCVaultStrat pool to ZunamiPool`);
    // await createAndInitStrategy(
    //     zunamiPool,
    //     '',
    //     genericOracleAddr,
    //     tokenConverter
    // );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
