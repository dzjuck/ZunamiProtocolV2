const { ethers } = require('hardhat');

async function main() {
    // zunUSD
    const omnipoolAddr = '0x8C0D76C9B18779665475F3E212D9Ca1Ed6A1A0e6';
    const apsControllerAddr = '0xd9F559280c9d308549e84946C0d668a817fcCFB5';
    const tokenConverterAddr = '0xf48A59434609b6e934c2cF091848FA2D28b34bfc';
    const stakingAddr = '0x280d48e85f712e067a16d6b25e7ffe261c0810bd';
    const oracleAddr = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';

    const ZunamiDepositZap3Factory = await ethers.getContractFactory('ZunamiDepositZap3');
    const zunamiDepositZap3 = await ZunamiDepositZap3Factory.deploy(
        omnipoolAddr,
        apsControllerAddr,
        stakingAddr,
        tokenConverterAddr,
        oracleAddr
    );
    console.log(
        'ZunamiDepositZap3 deployed to:',
        zunamiDepositZap3.address,
        'with args:',
        omnipoolAddr,
        apsControllerAddr,
        stakingAddr,
        tokenConverterAddr,
        oracleAddr
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
