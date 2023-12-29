const { ethers } = require('hardhat');

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
async function main() {
    console.log('Start deploy');

    const zunUsdAddress = '0x83287Da602f0C32f6C9B09E2F1b2951767ebF239';

    console.log('Deploy zunUSD APS pool:');
    const ZunamiPool = await ethers.getContractFactory('ZunamiPool');
    const zunamiPool = await ZunamiPool.deploy('Zunami USD Aps Test', 'zunUSDAPSTEST');
    // const zunamiPool = await ZunamiPool.attach('');
    await zunamiPool.deployed();
    console.log('ZunamiPool:', zunamiPool.address);

    const tokens = [zunUsdAddress];
    const tokensMultipliers = [1];
    let result = await zunamiPool.setTokens(tokens, tokensMultipliers);
    await result.wait();
    console.log('ZunamiPool tokens set:', tokens, tokensMultipliers);

    console.log('Deploy zunUSD aps compound pool controller:');
    const ZunamiPoolCompoundController = await ethers.getContractFactory(
        'ZunamiPoolCompoundController'
    );

    const zunamiPoolController = await ZunamiPoolCompoundController.deploy(
        zunamiPool.address,
        'Zunami USD Aps LP Test',
        'zunUSDAPSLPTEST'
    );
    await zunamiPoolController.deployed();
    console.log(
        'ZunamiPoolController:',
        zunamiPoolController.address,
        await zunamiPoolController.name(),
        await zunamiPoolController.symbol()
    );

    await zunamiPool.grantRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address);
    console.log(
        'ZunamiPoolController granted CONTROLLER_ROLE:',
        await zunamiPool.hasRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address)
    );

    const stratName = 'VaultStrat';
    const VaultStratFactory = await ethers.getContractFactory(stratName);
    const strategy = await VaultStratFactory.deploy(
        [tokens[0], ADDRESS_ZERO, ADDRESS_ZERO, ADDRESS_ZERO, ADDRESS_ZERO],
        [tokensMultipliers[0], 0, 0, 0, 0]
    );
    await strategy.deployed();
    console.log(`${stratName} strategy deployed to: ${strategy.address}`);

    result = await zunamiPool.addStrategy(strategy.address);
    await result.wait();
    console.log(`Added ${stratName} pool to ZunamiPool`);

    result = await strategy.setZunamiPool(zunamiPool.address);
    await result.wait();
    console.log(`Set zunami pool address ${zunamiPool.address} in ${stratName} strategy`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
