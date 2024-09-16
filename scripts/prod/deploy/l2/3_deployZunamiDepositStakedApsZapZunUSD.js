const { ethers } = require('hardhat');

async function main() {
    // zunUSD Base
    const apsControllerAddr = '0x65363f1A6cb67fE045bbD2fb3c5cb81bFBEe7902';
    const stakingAddr = '0x6088d4E45B4490d56d2C850816F2cCE9c20D5CCe';

    const ZapFactory = await ethers.getContractFactory('ZunamiDepositStakedApsZap');
    const zap = await ZapFactory.deploy(
        apsControllerAddr,
        stakingAddr
    );
    await zap.deployed();
    console.log(
        'ZunamiDepositStakedApsZap deployed to:',
        zap.address,
        'with args:',
        apsControllerAddr,
        stakingAddr
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
