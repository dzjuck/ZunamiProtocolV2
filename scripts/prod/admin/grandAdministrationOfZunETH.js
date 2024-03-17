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

    const ZunamiPool = await ethers.getContractFactory('ZunamiPoolZunETH');
    const zunamiPool = await ZunamiPool.attach('0xc2e660C62F72c2ad35AcE6DB78a616215E2F2222');
    console.log('ZunamiPoolZunETH:', zunamiPool.address);

    await grantRoleTo(newAdmin, zunamiPool, 'DEFAULT_ADMIN_ROLE');
    await grantRoleTo(newAdmin, zunamiPool, 'EMERGENCY_ADMIN_ROLE');

    const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolControllerZunETH');
    const zunamiPoolController = await ZunamiPoolController.attach(
        '0x54A00DA65c79DDCe24E7fe4691737FD70F7797DF'
    );
    console.log('ZunamiPoolControllerZunETH:', zunamiPoolController.address);

    await grantRoleTo(newAdmin, zunamiPoolController, 'DEFAULT_ADMIN_ROLE');

    await grandStrategyAdministrationTo(
        newAdmin,
        'ZunETHVaultStrat',
        '0x5F8Fc0976FFE5457cCf7651D5FF4cfcA2e86b000'
    );

    await grandStrategyAdministrationTo(
        newAdmin,
        'stEthEthConvexCurveStrat',
        '0x82685875f14bf1f76913df2F369a6cED74A725A8'
    );

    await grandStrategyAdministrationTo(
        newAdmin,
        'sfrxETHERC4626Strat',
        '0x342209D6ED7B851d366DfE15deC15689D55d72f6'
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
