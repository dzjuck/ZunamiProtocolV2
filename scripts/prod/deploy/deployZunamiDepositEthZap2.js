const { ethers } = require('hardhat');

async function main() {
    // zunETH
    const omnipoolAddr = '0xc2e660C62F72c2ad35AcE6DB78a616215E2F2222';
    const apsControllerAddr = '0xD8132d8cfCA9Ed8C95e46Cb59ae6E2C9963dA61f';
    const tokenConverterAddr = '0xf48A59434609b6e934c2cF091848FA2D28b34bfc';

    const ZunamiDepositZap2Factory = await ethers.getContractFactory('ZunamiDepositEthZap2');
    const zunamiDepositZap2 = await ZunamiDepositZap2Factory.deploy(
        omnipoolAddr,
        apsControllerAddr,
        tokenConverterAddr
    );
    console.log(
        'ZunamiDepositEthZap2 deployed to:',
        zunamiDepositZap2.address,
        'with args:',
        omnipoolAddr,
        apsControllerAddr,
        tokenConverterAddr
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
