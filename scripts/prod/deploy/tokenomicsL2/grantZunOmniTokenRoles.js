const { ethers, network } = require('hardhat');

async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();
    console.log('Admin:', admin.address);

    console.log('Network: ', network.name, ' ', network.config.chainId);

    // Zunami Omni Token (ZUN): 0x346E74Dc9935a9b02Eb34fB84658a66010fA056D
    // ARB - 0xE48F89A1daefFFBb79fA2CBB9CC936CB55Ea3D5F

    // Zunami Omni Token (ZUN): 0x1db0Fc8933f545648b54A9eE4326209a9A259643
    // BASE - 0xC3c6C182d85676f5d81D6865c2cd3b62bc5D1ccA

    // Zunami Omni Token (ZUN): 0x25193034153AfB4251a8E02a8Db0DeaeF4C876F6
    // OP - 0x0E20E8900F67b7714DAdBD105e24c84CDE487d13

    const zunAddr = "";
    const roleReceiver = "";

    // ZUN Omni Token
    const ZUNToken = await ethers.getContractFactory('ZunamiOmniToken');
    const zunToken = await ZUNToken.attach(zunAddr);
    await zunToken.deployed();
    console.log('Zunami Omni Token (ZUN):', zunToken.address);

    await zunToken.grantRole(await zunToken.MINTER_ROLE(), roleReceiver);
    console.log('MINTER_ROLE granted to:', roleReceiver);

    await zunToken.grantRole(await zunToken.BURNER_ROLE(), roleReceiver);
    console.log('BURNER_ROLE granted to:', roleReceiver);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
