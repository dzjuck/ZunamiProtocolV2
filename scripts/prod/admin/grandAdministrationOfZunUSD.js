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

    const ZunamiPool = await ethers.getContractFactory('ZunamiPoolZunUSD');
    const zunamiPool = await ZunamiPool.attach('0x8C0D76C9B18779665475F3E212D9Ca1Ed6A1A0e6');
    console.log('ZunamiPoolZunUSD:', zunamiPool.address);

    await grantRoleTo(newAdmin, zunamiPool, 'DEFAULT_ADMIN_ROLE');
    await grantRoleTo(newAdmin, zunamiPool, 'EMERGENCY_ADMIN_ROLE');

    const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolControllerZunUSD');
    const zunamiPoolController = await ZunamiPoolController.attach(
        '0x618eee502CDF6b46A2199C21D1411f3F6065c940'
    );
    console.log('ZunamiPoolControllerZunUSD:', zunamiPoolController.address);

    await grantRoleTo(newAdmin, zunamiPoolController, 'DEFAULT_ADMIN_ROLE');

    await grandStrategyAdministrationTo(
        newAdmin,
        'ZunUSDVaultStrat',
        '0x7Aa84C31BE1793f2dAb8Dbe36fAa9478aF8851a0'
    );

    await grandStrategyAdministrationTo(
        newAdmin,
        'UsdcCrvUsdStakeDaoCurve',
        '0x8D4D612D96D69C9DF83c2607f08f6E361983E598'
    );

    await grandStrategyAdministrationTo(
        newAdmin,
        'UsdtCrvUsdStakeDaoCurve',
        '0xadFa8e4C7004a9373426aC4F37F146a42aE699AB'
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
