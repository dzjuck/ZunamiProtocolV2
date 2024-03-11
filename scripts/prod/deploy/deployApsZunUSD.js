const { ethers } = require('hardhat');

async function createAndInitStrategy(zunamiPool, stratName, oracleAddress, stableConverterAddress) {
    const StratFactory = await ethers.getContractFactory(stratName);
    const strategy = await StratFactory.deploy();
    await strategy.deployed();
    console.log(`${stratName} strategy deployed to: ${strategy.address}`);

    if (!!oracleAddress) {
        result = await strategy.setPriceOracle(oracleAddress);
        await result.wait();
        console.log(`Set price oracle address ${oracleAddress} in ${stratName} strategy`);
    }

    if (!!stableConverterAddress) {
        result = await strategy.setStableConverter(stableConverterAddress);
        await result.wait();
        console.log(
            `Set stable converter address ${stableConverterAddress} in ${stratName} strategy`
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

    console.log('Deploy zunUSD APS omnipool:');
    const ZunamiPool = await ethers.getContractFactory('ZunamiPoolApsZunUSD');
    const zunamiPool = await ZunamiPool.attach('0x28e487bbF6b64867C29e61DccbCD17aB64082889');
    // const zunamiPool = await ZunamiPool.deploy();
    // await zunamiPool.deployed();
    console.log('ZunamiPoolApsZunUSD:', zunamiPool.address);

    // console.log('Deploy zunUSD APS pool controller:');
    // const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolControllerApsZunUSD');
    // const zunamiPoolController = await ZunamiPoolController.deploy(zunamiPool.address);
    // await zunamiPoolController.deployed();
    // console.log('ZunamiPoolControllerApsZunUSD:', zunamiPoolController.address);
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
    // await createAndInitStrategy(zunamiPool, 'ZunUSDApsVaultStrat', null, null);

    const genericOracleAddress = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
    const stableConverterAddress = '0x0236B7A3996d8c3597173aA95fD2a915c7A8A42E';
    await createAndInitStrategy(
        zunamiPool,
        'ZunUsdCrvUsdApsConvexCurveStrat',
        genericOracleAddress,
        stableConverterAddress
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
