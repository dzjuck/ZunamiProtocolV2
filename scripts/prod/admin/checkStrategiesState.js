const { ethers } = require('hardhat');

async function main() {

    const ZunamiPool = await ethers.getContractFactory('ZunamiPoolZunUSD');
    const zunamiPool = await ZunamiPool.attach('0x8C0D76C9B18779665475F3E212D9Ca1Ed6A1A0e6');
    console.log('ZunamiPoolZunUSD:', zunamiPool.address);

    const ZunamiPoolController = await ethers.getContractFactory('ZunamiPoolControllerZunUSD');
    const zunamiPoolController = await ZunamiPoolController.attach(
        '0x618eee502CDF6b46A2199C21D1411f3F6065c940'
    );
    console.log('ZunamiPoolControllerZunUSD:', zunamiPoolController.address);

    const TokenConverterFactory = await ethers.getContractFactory('TokenConverter');
    const tokenConverter = await TokenConverterFactory.attach(
        '0xf48A59434609b6e934c2cF091848FA2D28b34bfc'
    );
    console.log('TokenConverter:', tokenConverter.address);

    const StrategyFactory = await ethers.getContractFactory("VaultStrat");

    const length = await zunamiPool.strategyCount();
    for (let i = 0; i < length; i++) {
        console.log('Strategy ', i, ' :');
        const strategyInfo = await zunamiPool.strategyInfo(i);
        const strategyAddress = strategyInfo.strategy;
        const strategy = await StrategyFactory.attach(strategyAddress);
        const totalHoldings = await strategy.totalHoldings();
        console.log(' -- total holdings:', totalHoldings.toString());

        const minted = strategyInfo.minted;
        console.log(' -- minted:', minted.toString());
        console.log(' -- diff:', totalHoldings.sub(minted).toString());
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
