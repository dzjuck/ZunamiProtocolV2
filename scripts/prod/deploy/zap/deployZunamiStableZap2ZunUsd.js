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
