const { ethers } = require('hardhat');

async function main() {
    // zunUSD
    const omnipoolAddr = '0x0FA308AE0ddE633b6eDE22ba719E7E0Bc45FC6dB';
    const apsControllerAddr = '0xAEa5f929bC26Dea0c3f5d6dcb0e00ce83751Fc41';
    const tokenConverterAddr = '0xf48A59434609b6e934c2cF091848FA2D28b34bfc';
    const stakingAddr = '0xe03D3429b958E73eDF4Cf985a823c70B01B48280';
    const oracleAddr = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
    const rewardToken = '0x6b5204B0Be36771253Cc38e88012E02B752f0f36';

    const ZunamiZapFactory = await ethers.getContractFactory('ZunamiZap');
    const zunamiZap = await ZunamiZapFactory.deploy(
        omnipoolAddr,
        apsControllerAddr,
        stakingAddr,
        tokenConverterAddr,
        oracleAddr,
        rewardToken
    );
    console.log(
        'ZunamiZap zunBTC deployed to:',
        zunamiZap.address,
        'with args:',
        omnipoolAddr,
        apsControllerAddr,
        stakingAddr,
        tokenConverterAddr,
        oracleAddr,
        rewardToken
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
