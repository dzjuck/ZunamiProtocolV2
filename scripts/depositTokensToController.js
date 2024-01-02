const { ethers } = require('hardhat');
async function main() {
    console.log('Start depositing tokens to controller');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const poolAddr = '';
    const controllerAddr = '';
    const tokenAddresses = ['', '', ''];

    const ERC20TokenFactory = await ethers.getContractFactory('ERC20Token');
    const tokens = await Promise.all(
        tokenAddresses.map(async (tokenAddress) => {
            const token = await ERC20TokenFactory.attach(tokenAddress);
            await token.deployed();
            return token;
        })
    );

    const ZunamiPool = await ethers.getContractFactory('ZunamiPool');
    const zunamiPool = await ZunamiPool.attach(poolAddr);
    await zunamiPool.deployed();
    console.log('ZunamiPool:', zunamiPool.address);

    const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolThroughController');

    const zunamiPoolController = await ZunamiPoolController.attach(controllerAddr);
    await zunamiPoolController.deployed();
    console.log('ZunamiPoolController:', zunamiPoolController.address);

    await Promise.allSettled(
        tokens.map(async (token) => {
            const balance = await token.balanceOf(admin.address);
            console.log('Token: ', token.address, balance.toString());

            const txi = await token.approve(zunamiPoolController.address, balance);
            await txi.wait();
        })
    );

    const tx = await zunamiPoolController.deposit(
        ['100000000000000000000', '100000000', '100000000', 0, 0],
        admin.address
    );
    await tx.wait();

    console.log('Deposited: ', (await zunamiPool.balanceOf(admin.address)).toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
