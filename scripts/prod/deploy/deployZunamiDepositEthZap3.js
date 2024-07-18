const { ethers } = require('hardhat');

async function main() {
    // zunETH
    const omnipoolAddr = '0xc2e660C62F72c2ad35AcE6DB78a616215E2F2222';
    const apsControllerAddr = '0xD8132d8cfCA9Ed8C95e46Cb59ae6E2C9963dA61f';
    const tokenConverterAddr = '0xf48A59434609b6e934c2cF091848FA2D28b34bfc';
    const stakingAddr = '0x61b31cF4039D39F2F2909B8cb82cdb8eB5927Cd8';
    const oracleAddr = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';

    const ZunamiDepositZap3Factory = await ethers.getContractFactory('ZunamiDepositEthZap3');
    const zunamiDepositZap3 = await ZunamiDepositZap3Factory.deploy(
        omnipoolAddr,
        apsControllerAddr,
        stakingAddr,
        tokenConverterAddr,
        oracleAddr
    );
    console.log(
        'ZunamiDepositEthZap3 deployed to:',
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
