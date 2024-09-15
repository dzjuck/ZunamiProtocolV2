const { ethers } = require('hardhat');

async function main() {
    // zunUSD
    const omnipoolAddr = '0x8C0D76C9B18779665475F3E212D9Ca1Ed6A1A0e6';
    const apsControllerAddr = '0xd9F559280c9d308549e84946C0d668a817fcCFB5';
    const tokenConverterAddr = '0xf48A59434609b6e934c2cF091848FA2D28b34bfc';

    const ZunamiDepositZap2Factory = await ethers.getContractFactory('ZunamiDepositZap2');
    const zunamiDepositZap2 = await ZunamiDepositZap2Factory.deploy(
        omnipoolAddr,
        apsControllerAddr,
        tokenConverterAddr
    );
    console.log(
        'ZunamiDepositZap2 deployed to:',
        zunamiDepositZap2.address,
        'with args:',
        omnipoolAddr,
        apsControllerAddr
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
