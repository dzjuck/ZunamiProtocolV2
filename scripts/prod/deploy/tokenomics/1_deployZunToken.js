const { ethers } = require('hardhat');
async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();
    console.log('Admin:', admin.address);

    // ZUN Token
    console.log('Deploy Zun Token:');
    const ZUNToken = await ethers.getContractFactory('ZunamiToken');
    const zunToken = await ZUNToken.deploy(admin.address);
    await zunToken.deployed();
    console.log('Zunami Token (ZUN):', zunToken.address);

    const zunBalance = await zunToken.balanceOf(admin.address);
    console.log('ZUN balance:', ethers.utils.formatEther(zunBalance));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
