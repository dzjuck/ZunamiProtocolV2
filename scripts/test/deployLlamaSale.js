const { ethers } = require('hardhat');
const { GenericOracle } = require('../../typechain-types');
const {
    attachPoolAndControllerZunUSD,
} = require('../../test/utils/AttachPoolAndControllerZunUSD');

async function main() {
    console.log('Start deploy');


    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const block = 5757741;
    const timestamp = 1713845844;

    const holders = ['0xe9b2B067eE106A6E518fB0552F3296d22b82b32B', '0xaeE0Cbb0F1b484F60b5B197f232BA104505B56c2'];
    const round0 = {
        startBlock: Math.round(block + (1713816000 - timestamp) / 12), // 1713816000 // Friday, April 23, 2024 12:00:00 AM
        endBlock: Math.round(block + (1713988800 - timestamp) / 12) // 1713988800 // Sunday, April 25, 2024 12:00:00 AM
    };

    const round1 = {
        startBlock: Math.round(block + (1714075200 - timestamp) / 12), // 1714075200 // Monday, April 26, 2024 12:00:00 AM
        endBlock: Math.round(block + (1714161600 - timestamp) / 12)// 1714161600 // Wednesday, April 27, 2024 12:00:00 AM
    };


    const LlamaSaleFactory = await ethers.getContractFactory('LlamaSale');
    const llamaSale = await LlamaSaleFactory.deploy(admin.address, holders, round0, round1);
    console.log('LlamaSale deployed to:', llamaSale.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
