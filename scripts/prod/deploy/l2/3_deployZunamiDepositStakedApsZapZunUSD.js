const { ethers } = require('hardhat');

async function main() {
    // zunUSD Base
    const apsControllerAddr = '0x83ed27966584d24a788D2331B4824f490d3DD071';
    const stakingAddr = '0x0030b9c15bC3575ffd1dc96eD3a6548Ee5Ab280F';

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
