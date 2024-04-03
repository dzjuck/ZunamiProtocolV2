const { ethers } = require('hardhat');

async function main() {
    // zunUSD
    const omnipoolAddr = '';
    const apsControllerAddr = '0xd9F559280c9d308549e84946C0d668a817fcCFB5';
    const tokenConverterAddr = '';

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
        omnipoolControllerAddr,
        apsControllerAddr
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
