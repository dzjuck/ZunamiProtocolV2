const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');

async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();
    console.log('Admin:', admin.address);

    const zunAddr = '0xbf3127C1554C02f4e60031E29f890a1A700564f6';
    const tokenFactory = await ethers.getContractFactory('ERC20Token');
    const zun = await tokenFactory.attach(zunAddr);

    const zunDistributorAddr = '';
    const contractFactory = await ethers.getContractFactory('ZunDistributor');
    const constract = await contractFactory.attach(zunDistributorAddr);

    console.log('ZUN balanceOf before:', await zun.balanceOf(admin.address));
    await (await constract.withdrawEmergency(zunAddr)).wait();
    console.log('ZUN balanceOf after:', await zun.balanceOf(admin.address));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
