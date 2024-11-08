const { ethers } = require('hardhat');

async function grantRoleTo(newAdmin, contract, roleName) {
    const role = await contract[roleName]();
    let result = await contract.grantRole(role, newAdmin);
    await result.wait();
    console.log(
        newAdmin + ' granted ' + roleName + '(' + role + '):',
        await contract.hasRole(role, newAdmin)
    );
}

// OwnershipTransferred
const ownableContracts = [ // Ownable2Step
    "0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410", // GenericOracle
    "0x4DA60AF547c24eBFD5ECC8325E7F24BDb69F1a48", // CurveLPOracle
    "0xf48A59434609b6e934c2cF091848FA2D28b34bfc", // TokenConverter
    "0x0Cf4489417c696aF7d5F805E2874eB25940b48aB", // ZunUsd/ CrvUsd StaticCurveLPOracle
    "0x4D271aFe204a32A06a916Ab536b67f1A306a2286", // SellingCurveRewardManager2
    "0x033D7969791De147cD357f3Ddb2C48b2e2f6b309", // RewardViewer
    "0xc2fc3f0a8847c9ff83c4cfb6886751d9bf061511", // pxETH/wETH StaticCurveLPOracle
    "0xEEA950a509d822CF65edcEED53d161fBaa967B3a", // ZunDistributor
    "0x13eA95Ce68185e334d3747539845A3b7643a8cab", // ZUNUSD/FXUSD StaticCurveLPOracle
    "0xE8EC19Dd3f895598Ed4594885774Be3667B51c7C", // ETH_ETHx StaticCurveLPOracle
    "0xd1C5B89b0B0583352aC8fAc60F44b264E93000d3", // ZUNPX/ETH StaticCurveLPOracle
    "0x3b3939d3c796C35e2fE1735E31fCb0edf72b9C95", // frax/crvUSD StaticCurveLPOracle
    "0xC636b0C256fA72C9C9c1C2C0e252E4768e99A5db" // ZunEth StaticCurveLPOracle
];

//RoleAdminChanged RoleGranted RoleRevoked
const accessedContracts = [ // AccessControl
    "0x8C0D76C9B18779665475F3E212D9Ca1Ed6A1A0e6", // ZunamiPoolZunUSD
    "0x618eee502CDF6b46A2199C21D1411f3F6065c940", // ZunamiPoolControllerZunUSD old
    "0x2F858e4d6a96c81E37a130314D6cECB64FDC6f4E", // ZunamiPoolControllerZunUSD
    "0x7Aa84C31BE1793f2dAb8Dbe36fAa9478aF8851a0", // ZunUSDVaultStrat
    "0x28e487bbF6b64867C29e61DccbCD17aB64082889", // ZunamiPoolApsZunUSD
    "0xd9F559280c9d308549e84946C0d668a817fcCFB5", // ZunamiPoolControllerApsZunUSD
    "0xF859C621D7fF69DF1E283385DBdE04135EEA0276", // ZunUSDApsVaultStrat
    "0x8D4D612D96D69C9DF83c2607f08f6E361983E598", // UsdcCrvUsdStakeDaoCurve
    "0xadFa8e4C7004a9373426aC4F37F146a42aE699AB", // UsdtCrvUsdStakeDaoCurve
    "0x770f991Ca9f3D1Db503024C7144498F4e5DC6CC9", // ZunUsdCrvUsdApsConvexCurveStrat
    "0xc2e660C62F72c2ad35AcE6DB78a616215E2F2222", // ZunamiPoolZunETH
    "0x54A00DA65c79DDCe24E7fe4691737FD70F7797DF", // ZunamiPoolControllerZunETH old
    "0x4BD57f97E35E7c3302Dc3A8d4d803826856F9f32", // ZunamiPoolControllerZunETH
    "0x5F8Fc0976FFE5457cCf7651D5FF4cfcA2e86b000", // ZunETHVaultStrat
    "0x948F65Ffb065AD5afd4c9A032D56fbDe6Ba647F1", // stEthEthConvexCurveStrat
    "0x15370F2c446E41794A1b554946B826dB6eD04ceB", // sfrxETHERC4626Strat
    "0x5Ab3aa11a40eB34f1d2733f08596532871bd28e2", // ZunamiPoolApsZunETH
    "0xD8132d8cfCA9Ed8C95e46Cb59ae6E2C9963dA61f", // ZunamiPoolControllerApsZunETH
    "0xcB17C25985E5873Ad5D1114B0E03947fC49e5654", // ZunETHApsVaultStrat
    "0x1162C741bda2D0284E88D7C13c1B0BFEb4f81574", // ZunamiDepositZapFactoryZunETH
    "0x92cCC61730971Fe2321823aB64f3BC89F5421C5e", // ZunEthFrxEthApsStakeDaoCurveStrat
    "0x8dfcD34b074517C446a7885c271AFD365981Ed47", // LlamalendCrvUsdStakeDaoERC4626Strat
    "0x8BBef98615AE53B19b7843aDD009e8BB6F6f1656", // sfrxETHERC4626Strat
    "0x72A2394c42521038a91c94f5b4C421fAa45E0719", // pxETHwETHStakeDaoCurveNStrat
    "0x45af4F12B46682B3958B297bAcebde2cE2E795c3", // vlZUN
    "0x280d48e85f712e067a16d6b25e7ffe261c0810bd", // Zunami USD APS LP Staking
    "0x61b31cF4039D39F2F2909B8cb82cdb8eB5927Cd8", // Zunami ETH APS LP Staking
    "0xE527082401705c5b395E3e7a91B0be6e78357159", // ZunEthFrxEthApsStakingConvexCurveStrat
    "0x5De1BDedcDef3A5D6A833B6385Ef7bD24e6998f1", // LlamalendWethStakeDaoERC4626Strat
    "0x5F0C266aafe03D0921Fc60900374678F6D0A1251", // LlamalendWethStakeDaoERC4626Strat
    "0x2457C9a3cc6221674c3C91e07A7f193037adDD43", // ZunUsdCrvUsdApsStakeDaoCurveStrat
    "0xCEefF1B0b1863465ff11B62080AC40B544954062", // EthxEthStakeDaoCurveStrat
    "0xF3558b523235fE9bb78A02CA6F18292F4796ab73", // LlamalendCrvStakeDaoERC4626Strat
    "0x950a509528Ae5fc5bca6b20141FB0df2C04A7BF2", // ZunEthPxEthApsStakeDaoCurveStrat
    "0x531BbA64373A1B8E5a94BB51ba32CCe1cB42633D", // LlamalendWeth2StakeDaoERC4626Strat
    "0xEe58Bf056579786cf11A68c901664A5BA8BDACcf", // FraxCrvUsdStakeDaoCurve
    "0x0FA308AE0ddE633b6eDE22ba719E7E0Bc45FC6dB", // ZunamiPoolZunBTC
    "0x8d6C5C61E815A53b1D24AC94DEEC62f31911EeB4", // ZunamiPoolControllerZunBTC
    "0x1315cD2aa195eaAcFE9cD83135AeFa19Bf07d449", // ZunBTCVaultStrat
    "0x3c6e1ffffc293e93bb383b375ba348b85e828D82", // ZunamiPoolApsZunBTC
    "0xAEa5f929bC26Dea0c3f5d6dcb0e00ce83751Fc41", // ZunamiPoolControllerApsZunBTC
    "0x46ACb3e0c0954DB538cF7EF9e475BCeA83c3eD65", // ZunBTCApsVaultStrat
    "0x330861915286814D6A1bEE0cc1CD955C80846AF5", // WBtcTBtcConvexCurveStrat
    "0xe03D3429b958E73eDF4Cf985a823c70B01B48280", // Zunami BTC APS LP Staking
    "0xd5D1ACC9c7EbAf8bBF85C45AEe2b8b3f3b1bd062", // RecapitalizationManager
];

async function main() {
    const newAdmin = '0xb056B9A45f09b006eC7a69770A65339586231a34';


}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
