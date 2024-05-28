const { ethers } = require('hardhat');

async function main() {
    const omnipoolControllerAddr = '';
    const apsControllerAddr = '';

    const ZunamiDepositZapFactory = await ethers.getContractFactory('ZunamiDepositZap');
    const zunamiDepositZap = await ZunamiDepositZapFactory.deploy(
        omnipoolControllerAddr,
        apsControllerAddr
    );
    console.log(
        'ZunamiDepositZapFactory deployed to:',
        zunamiDepositZap.address,
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
