const { ethers } = require('hardhat');

async function main() {
    // zunUSD
    const omniControllerAddr = '0x8d6C5C61E815A53b1D24AC94DEEC62f31911EeB4';
    const apsControllerAddr = '0xAEa5f929bC26Dea0c3f5d6dcb0e00ce83751Fc41';
    const stakingAddr = '0xe03D3429b958E73eDF4Cf985a823c70B01B48280';
    const rewardToken = '0x6b5204B0Be36771253Cc38e88012E02B752f0f36';

    const ZunamiZapFactory = await ethers.getContractFactory('ZunamiLaunchZap');
    const zunamiZap = await ZunamiZapFactory.deploy(
        omniControllerAddr,
        apsControllerAddr,
        stakingAddr,
        rewardToken
    );
    console.log(
        'ZunamiLaunchZap zunBTC deployed to:',
        zunamiZap.address,
        'with args:',
        omniControllerAddr,
        apsControllerAddr,
        stakingAddr,
        rewardToken
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
