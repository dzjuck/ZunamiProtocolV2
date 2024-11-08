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

    // const ZunamiPool = await ethers.getContractFactory('ZunamiPoolZunETH');
    // const zunamiPool = await ZunamiPool.attach('0xc2e660C62F72c2ad35AcE6DB78a616215E2F2222');
    // console.log('ZunamiPoolZunETH:', zunamiPool.address);
    //
    // await grantRoleTo(newAdmin, zunamiPool, 'DEFAULT_ADMIN_ROLE');
    // await grantRoleTo(newAdmin, zunamiPool, 'EMERGENCY_ADMIN_ROLE');
    //
    const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolControllerZunETH');
    const zunamiPoolController = await ZunamiPoolController.attach(
        '0x4BD57f97E35E7c3302Dc3A8d4d803826856F9f32'
    );
    console.log('ZunamiPoolControllerZunETH:', zunamiPoolController.address);

    await grantRoleTo(newAdmin, zunamiPoolController, 'DEFAULT_ADMIN_ROLE');

    // await grandStrategyAdministrationTo(
    //     newAdmin,
    //     'ZunETHVaultStrat',
    //     '0x5F8Fc0976FFE5457cCf7651D5FF4cfcA2e86b000'
    // );
    //
    // await grandStrategyAdministrationTo(
    //     newAdmin,
    //     'stEthEthConvexCurveStrat',
    //     '0x948F65Ffb065AD5afd4c9A032D56fbDe6Ba647F1'
    // );
    //
    // await grandStrategyAdministrationTo(
    //     newAdmin,
    //     'sfrxETHERC4626Strat',
    //     '0x15370F2c446E41794A1b554946B826dB6eD04ceB'
    // );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
