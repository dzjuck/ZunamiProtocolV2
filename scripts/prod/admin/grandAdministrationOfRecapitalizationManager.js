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


async function main() {
    const newAdmin = '0xb056B9A45f09b006eC7a69770A65339586231a34';

    const RecapitalizationManagerFactory = await ethers.getContractFactory('RecapitalizationManager');
    const manager = await RecapitalizationManagerFactory.attach('0xd5d1acc9c7ebaf8bbf85c45aee2b8b3f3b1bd062');
    console.log('RecapitalizationManager:', manager.address);

    await grantRoleTo(newAdmin, manager, 'DEFAULT_ADMIN_ROLE');
    await grantRoleTo(newAdmin, manager, 'EMERGENCY_ADMIN_ROLE');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
