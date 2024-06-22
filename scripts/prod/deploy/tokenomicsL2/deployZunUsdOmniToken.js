const { ethers, network } = require('hardhat');

async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();
    console.log('Admin:', admin.address);

    console.log('Network: ', network.name, ' ', network.config.chainId);

    // ZUN Omni Token
    console.log('Deploy Zun Omni Token:');
    const ZUNToken = await ethers.getContractFactory('ZunamiOmniTokenV2');
    const zunToken = await ZUNToken.deploy('Zunami Omni USD', 'zunUSD');
    await zunToken.deployed();
    console.log('Zunami Omni Token (zunUSD):', zunToken.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
