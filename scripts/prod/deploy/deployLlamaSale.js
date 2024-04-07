const { ethers } = require('hardhat');
const { GenericOracle } = require('../../typechain-types');
const {
    attachPoolAndControllerZunUSD,
} = require('../../test/utils/AttachPoolAndControllerZunUSD');

async function main() {
    console.log('Start deploy');


    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const block = 19661576;
    const timestamp = 1713192167;

    const holders = [];
    const round0 = {
        startBlock: Math.round(block + (1713484800 - timestamp) / 12), // 1713484800 // Friday, April 19, 2024 12:00:00 AM
        endBlock: Math.round(block + (1713657600 - timestamp) / 12) // 1713657600 // Sunday, April 21, 2024 12:00:00 AM
    };

    const round1 = {
        startBlock: Math.round(block + (1713744000 - timestamp) / 12), // 1713744000 // Monday, April 22, 2024 12:00:00 AM
        endBlock: Math.round(block + (1713916800 - timestamp) / 12)// 1713916800 // Wednesday, April 24, 2024 12:00:00 AM
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
