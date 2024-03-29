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
async function grandStrategyRolesTo(newAdmin, stratName, stratAddr, roles) {
    const StratFactory = await ethers.getContractFactory(stratName);
    const strategy = await StratFactory.attach(stratAddr);
    console.log(`${stratName} strategy attached to: ${strategy.address}`);

    for (let i = 0; i < roles.length; i++) {
        await grantRoleTo(newAdmin, strategy, roles[i]);
    }
}

async function main() {
    const newAdmin = '0xb056B9A45f09b006eC7a69770A65339586231a34';

    const ZunamiPool = await ethers.getContractFactory('ZunamiPoolApsZunETH');
    const zunamiPool = await ZunamiPool.attach('0x5Ab3aa11a40eB34f1d2733f08596532871bd28e2');
    console.log('ZunamiPoolApsZunETH:', zunamiPool.address);

    await grantRoleTo(newAdmin, zunamiPool, 'DEFAULT_ADMIN_ROLE');
    await grantRoleTo(newAdmin, zunamiPool, 'EMERGENCY_ADMIN_ROLE');

    const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolControllerApsZunETH');
    const zunamiPoolController = await ZunamiPoolController.attach(
        '0xD8132d8cfCA9Ed8C95e46Cb59ae6E2C9963dA61f'
    );
    console.log('ZunamiPoolControllerApsZunETH:', zunamiPoolController.address);

    await grantRoleTo(newAdmin, zunamiPoolController, 'DEFAULT_ADMIN_ROLE');

    await grandStrategyRolesTo(
        newAdmin,
        'ZunETHApsVaultStrat',
        '0xcB17C25985E5873Ad5D1114B0E03947fC49e5654',
        ['DEFAULT_ADMIN_ROLE']
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
