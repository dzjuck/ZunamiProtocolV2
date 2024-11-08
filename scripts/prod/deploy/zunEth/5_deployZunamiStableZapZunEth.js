const { ethers } = require('hardhat');

async function main() {
    // zunETH
    const zunStableControllerAddr = '0x4BD57f97E35E7c3302Dc3A8d4d803826856F9f32';
    const generalOracleAddr = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
    const dailyMintDuration = 24 * 60 * 60; // 1 day in seconds
    const dailyMintLimit = ethers.utils.parseUnits('275', "ether"); // 1100000 / 4000
    const dailyRedeemDuration = 24 * 60 * 60; // 1 day in seconds;
    const dailyRedeemLimit = ethers.utils.parseUnits('25', "ether"); // 100000 / 4000
    const basedTokenAddr = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
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
        'ZunamiStableZap zunEth deployed to:',
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
