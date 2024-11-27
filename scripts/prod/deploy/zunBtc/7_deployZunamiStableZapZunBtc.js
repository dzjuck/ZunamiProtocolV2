const { ethers } = require('hardhat');

async function main() {
    // zunBTC
    const zunStableControllerAddr = '0x8d6C5C61E815A53b1D24AC94DEEC62f31911EeB4';
    const generalOracleAddr = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
    const dailyMintDuration = 24 * 60 * 60; // 1 day in seconds
    const dailyMintLimit = ethers.utils.parseUnits('12', "ether"); // 1100000 / 90000 = 12.222222222222222222
    const dailyRedeemDuration = 24 * 60 * 60; // 1 day in seconds;
    const dailyRedeemLimit = ethers.utils.parseUnits('1', "ether"); // 100000 / 90000 = 1.111111111111111111
    const basedTokenAddr = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB';
    const withdrawFee = 7500;
    const feeDistributor = "0xd5d1acc9c7ebaf8bbf85c45aee2b8b3f3b1bd062";

    const ZunamiStableZapFactory = await ethers.getContractFactory('ZunamiStableZap');
    const zunamiStableZap = await ZunamiStableZapFactory.deploy(
        zunStableControllerAddr,
        generalOracleAddr,
        dailyMintDuration,
        dailyMintLimit,
        dailyRedeemDuration,
        dailyRedeemLimit,
        basedTokenAddr,
        withdrawFee,
        feeDistributor
    );
    console.log(
        'ZunamiStableZap zunBtc deployed to:',
        zunamiStableZap.address,
        'with args:',
        zunStableControllerAddr,
        generalOracleAddr,
        dailyMintDuration,
        dailyMintLimit,
        dailyRedeemDuration,
        dailyRedeemLimit,
        basedTokenAddr,
        withdrawFee,
        feeDistributor
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
