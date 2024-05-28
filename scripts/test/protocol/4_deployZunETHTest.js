const { ethers } = require('hardhat');

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
async function main() {
    console.log('Start deploy');

    console.log('Deploy test tokens');
    const ERC20Factory = await ethers.getContractFactory('ERC20TokenNamed');
    const wETHTest = await ERC20Factory.deploy('TEST WETH', 'tWETH', 18);
    await wETHTest.deployed();
    console.log('wETHTest deployed:', wETHTest.address);

    const frxETHTest = await ERC20Factory.deploy('TEST FRXETH', 'tFRXETH', 18);
    await frxETHTest.deployed();
    console.log('frxETHTest deployed:', frxETHTest.address);

    console.log('Deploy zunETH omnipool:');
    const ZunamiPool = await ethers.getContractFactory('ZunamiPool');
    const zunamiPool = await ZunamiPool.deploy('Zunami ETH Test', 'zunETHTEST');
    await zunamiPool.deployed();
    console.log('ZunamiPool:', zunamiPool.address);

    const tokens = [wETHTest.address, frxETHTest.address, ADDRESS_ZERO, ADDRESS_ZERO, ADDRESS_ZERO];
    const tokensMultipliers = [1, 1, 0, 0, 0];
    let result = await zunamiPool.setTokens(tokens, tokensMultipliers);
    await result.wait();
    console.log('ZunamiPool tokens set:', tokens, tokensMultipliers);

    console.log('Deploy zunETH pool controller:');
    const ZunamiPoolThroughController = await ethers.getContractFactory(
        'ZunamiPoolThroughRedemptionFeeController'
    );

    const zunamiPoolController = await ZunamiPoolThroughController.deploy(zunamiPool.address);
    await zunamiPoolController.deployed();
    console.log('ZunamiPoolController:', zunamiPoolController.address);

    let tx = await zunamiPool.grantRole(
        await zunamiPool.CONTROLLER_ROLE(),
        zunamiPoolController.address
    );
    await tx.wait();
    console.log(
        'ZunamiPoolController granted CONTROLLER_ROLE:',
        await zunamiPool.hasRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address)
    );

    const stratName = 'VaultStrat';
    const VaultStratFactory = await ethers.getContractFactory(stratName);
    const strategy = await VaultStratFactory.deploy(tokens, tokensMultipliers);
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
