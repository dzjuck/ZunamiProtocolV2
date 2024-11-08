const { ethers } = require('hardhat');

async function main() {
    console.log('Start deploy');

    const genericOracleAddress = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
    const GenericOracleFactory = await ethers.getContractFactory('GenericOracle');
    const genericOracle = await GenericOracleFactory.attach(genericOracleAddress);
    console.log('GenericOracle attached to:', genericOracle.address);

    // const frxETHAddress = '0x5E8422345238F34275888049021821E8E08CAa1f';
    //
    // const FrxETHOracleFactory = await ethers.getContractFactory('FrxETHOracle');
    // const frxETHOracle = await FrxETHOracleFactory.deploy(genericOracleAddress);
    // await frxETHOracle.deployed();
    // console.log('FrxETHOracle deployed to:', frxETHOracle.address);
    //
    // await genericOracle.setCustomOracle(frxETHAddress, frxETHOracle.address);
    // console.log('FrxETH oracle set: ', frxETHAddress, frxETHOracle.address);

    // const wETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    // const WETHOracleFactory = await ethers.getContractFactory('WETHOracle');
    // const wETHOracle = await WETHOracleFactory.deploy(genericOracle.address);
    // console.log('wETHOracle deployed to:', wETHOracle.address);
    //
    // // await genericOracle.setCustomOracle(wETH, wETHOracle.address);
    // console.log('wETH oracle set: ', wETH, wETHOracle.address);

    const pxETH = '0x04C154b66CB340F3Ae24111CC767e0184Ed00Cc6';
    const PxETHOracleFactory = await ethers.getContractFactory('PxETHOracle');
    const pxETHOracle = await PxETHOracleFactory.deploy(genericOracle.address);
    console.log('pxETHOracle deployed to:', pxETHOracle.address);
    // await genericOracle.setCustomOracle(pxETH, pxETHOracle.address);
    console.log('pxETH oracle set: ', pxETH, pxETHOracle.address);

    // const StaticCurveLPOracleFactory = await ethers.getContractFactory('StaticCurveLPOracle');

    // const pxETH_wETH_pool_addr = '0xC8Eb2Cf2f792F77AF0Cd9e203305a585E588179D';
    // const staticCurveLPOracle = await StaticCurveLPOracleFactory.deploy(
    //     genericOracle.address,
    //     [wETH, pxETH],
    //     [18, 18],
    //     pxETH_wETH_pool_addr
    // );
    // await staticCurveLPOracle.deployed();
    // console.log('pxETHwETH pool StaticCurveLPOracle deployed to:', staticCurveLPOracle.address);
    // // await genericOracle.setCustomOracle(pxETH_wETH_pool_addr, staticCurveLPOracle.address);
    // console.log('pxETHwETH pool static oracle set: ', pxETH_wETH_pool_addr, staticCurveLPOracle.address);

    // const ETHAddr = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    // const ETHxAddr = '0xA35b1B31Ce002FBF2058D22F30f95D405200A15b';
    // const ETH_ETHx_pool_addr = '0x59Ab5a5b5d617E478a2479B0cAD80DA7e2831492';
    // const staticCurveLPOracleETHX = await StaticCurveLPOracleFactory.deploy(
    //     genericOracle.address,
    //     [ETHAddr, ETHxAddr],
    //     [18, 18],
    //     ETH_ETHx_pool_addr
    // );
    // await staticCurveLPOracleETHX.deployed();
    // console.log('ETH_ETHx StaticCurveLPOracle deployed to:', staticCurveLPOracleETHX.address);
    //
    // await genericOracle.setCustomOracle(ETH_ETHx_pool_addr, staticCurveLPOracleETHX.address);
    // console.log('ETH_ETHx pool static oracle set: ', ETH_ETHx_pool_addr, staticCurveLPOracleETHX.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
