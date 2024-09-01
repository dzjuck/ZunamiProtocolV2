const { ethers, upgrades } = require('hardhat');
const {getImplementationAddress} = require('@openzeppelin/upgrades-core');

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

    console.log('Deploy zunUSD Base APS omnipool:');
    const ZunamiPool = await ethers.getContractFactory('ZunamiPoolBaseApsZunUSD');
    // const zunamiPool = await ZunamiPool.attach('');
    const zunamiPool = await ZunamiPool.deploy();
    await zunamiPool.deployed();
    console.log('ZunamiPoolBaseApsZunUSD:', zunamiPool.address);

    console.log('Deploy zunUSD Base APS pool controller:');

    const ZunamiPoolControllerFactory = await ethers.getContractFactory('ZunamiPoolCompoundControllerUpgradeable');
    const zunamiPoolController = await upgrades.deployProxy(
        ZunamiPoolControllerFactory,
        [
            zunamiPool.address,
            'Zunami Staked USD APS LP',
            'stakedUSD'
        ],
        {
            kind: 'uups',
        }
    );
    await zunamiPoolController.deployed();

    console.log('Zunami Pool Compound Controller for zunUSD:', zunamiPoolController.address);
    console.log('Zunami Pool Compound Controller implementation deployed to:', await getImplementationAddress(ethers.provider, zunamiPoolController.address));

    let result = await zunamiPool.grantRole(
        await zunamiPool.CONTROLLER_ROLE(),
        zunamiPoolController.address
    );
    await result.wait();
    console.log(
        'ZunamiPoolController granted CONTROLLER_ROLE:',
        await zunamiPool.hasRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address)
    );
    await createAndInitStrategy(zunamiPool, 'ZunUSDBaseApsVaultStrat', null, null);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
