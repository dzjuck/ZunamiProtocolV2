const { ethers } = require('hardhat');

const { createAndInitConicOracles } = require('./utils/CreateAndInitConicOracles');

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
async function main() {
    console.log('Start deploy');

    console.log('Deploy test tokens');
    const ERC20Factory = await ethers.getContractFactory('ERC20Token');
    const daiTest = await ERC20Factory.deploy(18);
    await daiTest.deployed();
    console.log('daiTest deployed:', daiTest.address);

    const usdcTest = await ERC20Factory.deploy(6);
    await usdcTest.deployed();
    console.log('usdcTest deployed:', usdcTest.address);

    const usdtTest = await ERC20Factory.deploy(6);
    await usdtTest.deployed();
    console.log('usdtTest deployed:', usdtTest.address);

    // const {curveRegistryCache, chainlinkOracle, genericOracle, curveLPOracle} = await createAndInitConicOracles();

    console.log('Deploy zunUSD omnipool:');
    const ZunamiPool = await ethers.getContractFactory('ZunamiPool');
    const zunamiPool = await ZunamiPool.deploy('Zunami USD Test', 'zunUSDTEST');
    // const zunamiPool = await ZunamiPool.attach('');
    await zunamiPool.deployed();
    console.log('ZunamiPool:', zunamiPool.address);

    const tokens = [daiTest.address, usdcTest.address, usdtTest.address];
    const tokensMultipliers = [1, 1e12, 1e12];
    let result = await zunamiPool.setTokens(tokens, tokensMultipliers);
    await result.wait();
    console.log('ZunamiPool tokens set:', tokens, tokensMultipliers);

    console.log('Deploy zunUSD pool controller:');
    const ZunamiPoolThroughController = await ethers.getContractFactory(
        'ZunamiPoolThroughController'
    );

    const zunamiPoolController = await ZunamiPoolThroughController.deploy(zunamiPool.address);
    await zunamiPoolController.deployed();
    console.log('ZunamiPoolController:', zunamiPoolController.address);

    await zunamiPool.grantRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address);
    console.log('ZunamiPoolController granted CONTROLLER_ROLE:', await zunamiPool.hasRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address));

    const stratName = 'VaultStrat';
    const VaultStratFactory = await ethers.getContractFactory(stratName);
    const strategy = await VaultStratFactory.deploy(
        [...tokens, ADDRESS_ZERO, ADDRESS_ZERO],
        [...tokensMultipliers, 0, 0]
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
