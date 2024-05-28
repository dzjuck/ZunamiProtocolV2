const { ethers } = require('hardhat');
async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();
    console.log('Admin:', admin.address);

    console.log('Deploy Test Zun Token:');
    const ZunamiToken = await ethers.getContractFactory('ZunamiToken');
    const zunamiToken = await ZunamiToken.deploy(admin.address);
    await zunamiToken.deployed();
    console.log('Test Zunami Token (TZUN):', zunamiToken.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
