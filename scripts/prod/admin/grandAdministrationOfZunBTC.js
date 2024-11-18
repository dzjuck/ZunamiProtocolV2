const { ethers } = require('hardhat');

async function grantRoleTo(newAdmin, contract, roleName) {
    const role = await contract[roleName]();
    let result = await contract.grantRole(role, newAdmin);
    await result.wait();
    console.log(
        newAdmin + ' granted ' + roleName + '(' + role + '):',
        await contract.hasRole(role, newAdmin)
    );
}
async function grandStrategyAdministrationTo(newAdmin, stratName, stratAddr) {
    const StratFactory = await ethers.getContractFactory(stratName);
    const strategy = await StratFactory.attach(stratAddr);
    console.log(`${stratName} strategy attached to: ${strategy.address}`);

    await grantRoleTo(newAdmin, strategy, 'DEFAULT_ADMIN_ROLE');
}

async function main() {
    const newAdmin = '0xb056B9A45f09b006eC7a69770A65339586231a34';

    const ZunamiPool = await ethers.getContractFactory('ZunamiPoolZunBTC');
    const zunamiPool = await ZunamiPool.attach('0x0FA308AE0ddE633b6eDE22ba719E7E0Bc45FC6dB');
    console.log('ZunamiPoolZunUSD:', zunamiPool.address);

    await grantRoleTo(newAdmin, zunamiPool, 'DEFAULT_ADMIN_ROLE');
    await grantRoleTo(newAdmin, zunamiPool, 'EMERGENCY_ADMIN_ROLE');

    const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolControllerZunBTC');
    const zunamiPoolController = await ZunamiPoolController.attach(
        '0x8d6C5C61E815A53b1D24AC94DEEC62f31911EeB4'
    );
    console.log('ZunamiPoolControllerZunUSD:', zunamiPoolController.address);

    await grantRoleTo(newAdmin, zunamiPoolController, 'DEFAULT_ADMIN_ROLE');

    await grandStrategyAdministrationTo(
        newAdmin,
        'ZunBTCVaultStrat',
        '0x1315cD2aa195eaAcFE9cD83135AeFa19Bf07d449'
    );

    await grandStrategyAdministrationTo(
        newAdmin,
        'WBtcTBtcConvexCurveStrat',
        '0x330861915286814D6A1bEE0cc1CD955C80846AF5'
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
