const { ethers } = require('hardhat');

async function main() {
    // zunETH
    const zunStableControllerAddr = '0x54A00DA65c79DDCe24E7fe4691737FD70F7797DF';
    const generalOracleAddr = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
    const dailyMintDuration = 24 * 60 * 60; // 1 day in seconds
    const dailyMintLimit = ethers.utils.parseUnits('275', "ether"); // 1100000 / 4000
    const dailyRedeemDuration = 24 * 60 * 60; // 1 day in seconds;
    const dailyRedeemLimit = ethers.utils.parseUnits('25', "ether"); // 100000 / 4000
    const basedTokenAddr = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

    const ZunamiStableZapFactory = await ethers.getContractFactory('ZunamiStableZap2');
    const zunamiStableZap = await ZunamiStableZapFactory.deploy(
        zunStableControllerAddr,
        generalOracleAddr,
        dailyMintDuration,
        dailyMintLimit,
        dailyRedeemDuration,
        dailyRedeemLimit,
        basedTokenAddr
    );
    console.log(
        'ZunamiStableZap2 deployed to:',
        zunamiStableZap.address,
        'with args:',
        zunStableControllerAddr,
        generalOracleAddr,
        dailyMintDuration,
        dailyMintLimit,
        dailyRedeemDuration,
        dailyRedeemLimit,
        basedTokenAddr
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
