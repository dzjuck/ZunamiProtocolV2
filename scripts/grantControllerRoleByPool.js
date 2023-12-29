const { ethers } = require('hardhat');
async function main() {
    console.log('Start granting controller role by pool');

    const poolAddr = '';
    const controllerAddr = '';

    const ZunamiPool = await ethers.getContractFactory('ZunamiPool');
    const zunamiPool = await ZunamiPool.attach(poolAddr);
    await zunamiPool.deployed();
    console.log('ZunamiPool:', zunamiPool.address);

    const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolThroughController');

    const zunamiPoolController = await ZunamiPoolController.attach(controllerAddr);
    await zunamiPoolController.deployed();
    console.log('ZunamiPoolController:', zunamiPoolController.address);

    const tx = await zunamiPool.grantRole(
        await zunamiPool.CONTROLLER_ROLE(),
        zunamiPoolController.address
    );
    await tx.wait();
    console.log(
        'ZunamiPoolController granted CONTROLLER_ROLE:',
        await zunamiPool.hasRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address)
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
