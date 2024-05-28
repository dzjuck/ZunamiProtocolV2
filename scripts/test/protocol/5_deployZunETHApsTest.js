const { ethers } = require('hardhat');

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
async function main() {
    console.log('Start deploy');

    const zunUsdAddress = '0x482feEd67c440e6924662aaF4aBf45992a5009eB';
    const zunStablePostfix = 'ETH';

    console.log('Deploy zunUSD APS pool:');
    const ZunamiPool = await ethers.getContractFactory('ZunamiPool');
    const zunamiPool = await ZunamiPool.deploy(
        `Zunami ${zunStablePostfix} Aps Test`,
        `zun${zunStablePostfix}APSTEST`
    );
    await zunamiPool.deployed();
    console.log('ZunamiPool:', zunamiPool.address);

    const tokens = [zunUsdAddress, ADDRESS_ZERO, ADDRESS_ZERO, ADDRESS_ZERO, ADDRESS_ZERO];
    const tokensMultipliers = [1, 0, 0, 0, 0];
    let result = await zunamiPool.setTokens(tokens, tokensMultipliers);
    await result.wait();
    console.log('ZunamiPool tokens set:', tokens, tokensMultipliers);

    console.log('Deploy APS compound pool controller:');
    const ZunamiPoolCompoundController = await ethers.getContractFactory(
        'ZunamiPoolCompoundController'
    );

    const zunamiPoolController = await ZunamiPoolCompoundController.deploy(
        zunamiPool.address,
        `Zunami ${zunStablePostfix} Aps LP Test`,
        `zun${zunStablePostfix}APSLPTEST`
    );
    await zunamiPoolController.deployed();
    console.log(
        'ZunamiPoolController:',
        zunamiPoolController.address,
        await zunamiPoolController.name(),
        await zunamiPoolController.symbol()
    );

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
    console.log(`Set Zunami pool address ${zunamiPool.address} in ${stratName} strategy`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
