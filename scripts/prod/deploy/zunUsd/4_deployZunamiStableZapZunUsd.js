const { ethers } = require('hardhat');

async function main() {
    // zunUSD
    const zunStableControllerAddr = '0x2F858e4d6a96c81E37a130314D6cECB64FDC6f4E';
    const generalOracleAddr = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
    const dailyMintDuration = 24 * 60 * 60; // 1 day in seconds
    const dailyMintLimit = ethers.utils.parseUnits('1100000', "ether");
    const dailyRedeemDuration = 24 * 60 * 60; // 1 day in seconds;
    const dailyRedeemLimit = ethers.utils.parseUnits('100000', "ether");
    const basedTokenAddr = '0x0000000000000000000000000000000000000000';
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
        'ZunamiStableZap zunUSD deployed to:',
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
