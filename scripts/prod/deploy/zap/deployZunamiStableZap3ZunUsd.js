const { ethers } = require('hardhat');

async function main() {
    // zunUSD
    const zunStableControllerAddr = '0x618eee502CDF6b46A2199C21D1411f3F6065c940';
    const generalOracleAddr = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
    const dailyMintDuration = 24 * 60 * 60; // 1 day in seconds
    const dailyMintLimit = ethers.utils.parseUnits('1100000', "ether");
    const dailyRedeemDuration = 24 * 60 * 60; // 1 day in seconds;
    const dailyRedeemLimit = ethers.utils.parseUnits('100000', "ether");
    const basedTokenAddr = '0x0000000000000000000000000000000000000000';
    const withdrawFee = 5000;
    const feeDistributor = "0xb056B9A45f09b006eC7a69770A65339586231a34";

    const ZunamiStableZapFactory = await ethers.getContractFactory('ZunamiStableZap3');
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
        'ZunamiStableZap3 deployed to:',
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
