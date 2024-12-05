const { ethers } = require('hardhat');
const {
    setupTokenConverterStables,
    setupTokenConverterETHs,
    setupTokenConverterRewards,
    setupTokenConverterCrvUsdToZunEth,
    setupTokenConverterFxnToZunUsd,
    setupTokenConverterWEthPxEthAndReverse,
    setupTokenConverterStablesFrax,
    setupTokenConverterBTCs,
} = require('../../../test/utils/SetupTokenConverter.js');

async function main() {
    const curveRouterAddr = '0xF0d4c12A5768D806021F80a262B4d39d26C58b8D';

    console.log('Start deploy');
    const TokenConverterFactory = await ethers.getContractFactory('TokenConverter');
    // const tokenConverter = await TokenConverterFactory.deploy(curveRouterAddr);
    // await tokenConverter.deployed();
    const tokenConverter = await TokenConverterFactory.attach('0xf48A59434609b6e934c2cF091848FA2D28b34bfc');
    console.log('TokenConverter deployed to:', tokenConverter.address);

    // console.log('Starting setup token converter for stables');
    // await setupTokenConverterStables(tokenConverter);
    // console.log('Token сonverter configured for stables');
    //
    // console.log('Starting setup token converter for eths');
    // await setupTokenConverterETHs(tokenConverter);
    // console.log('Token сonverter configured for eths');
    //
    // console.log('Starting setup token converter for rewards');
    // await setupTokenConverterRewards(tokenConverter);
    // console.log('Token сonverter configured for rewards');
    //
    // console.log('Starting setup token converter crvUSD to zunETH');
    // await setupTokenConverterCrvUsdToZunEth(tokenConverter);
    // console.log('Token сonverter configured for crvUSD to zunETH');
    //
    // console.log('Starting setup token converter FXN to zunUSD');
    // await setupTokenConverterFxnToZunUsd(tokenConverter);
    // console.log('Token сonverter configured for FXN to zunUSD');

    // console.log('Starting setup token converter wETH to pxETH and reverse');
    // await setupTokenConverterWEthPxEthAndReverse(tokenConverter);
    // console.log('Token сonverter configured for  wETH to pxETH and reverse');

    // console.log('Starting setup token converter stables to frax and reverse');
    // await setupTokenConverterStablesFrax(tokenConverter);
    // console.log('Token сonverter configured for stables to frax and reverse');

    console.log('Starting setup token converter BTCs');
    await setupTokenConverterBTCs(tokenConverter);
    console.log('Token сonverter configured for BTCs');

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
