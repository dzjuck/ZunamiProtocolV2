const { ethers } = require('hardhat');

async function main() {
    // zunUSD
    const zunStableControllerAddr = '0x618eee502CDF6b46A2199C21D1411f3F6065c940';
    const dailyMintDuration = 24 * 60 * 60; // 1 day in seconds
    const dailyMintLimit = ethers.utils.parseUnits('1100000', "ether");
    const dailyRedeemDuration = 24 * 60 * 60; // 1 day in seconds;
    const dailyRedeemLimit = ethers.utils.parseUnits('100000', "ether");

    const ZunamiStableZapFactory = await ethers.getContractFactory('ZunamiStableZap');
    const zunamiStableZap = await ZunamiStableZapFactory.deploy(
        zunStableControllerAddr,
        dailyMintDuration,
        dailyMintLimit,
        dailyRedeemDuration,
        dailyRedeemLimit
    );
    console.log(
        'ZunamiStableZap deployed to:',
        zunamiStableZap.address,
        'with args:',
        zunStableControllerAddr,
        dailyMintDuration,
        dailyMintLimit,
        dailyRedeemDuration,
        dailyRedeemLimit
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
