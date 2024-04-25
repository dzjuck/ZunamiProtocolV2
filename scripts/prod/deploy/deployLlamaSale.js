const { ethers } = require('hardhat');

async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    // const block = 19729827;
    // const timestamp = 1714017239;

    const holders = [];
    const round0 = {
        startBlock: 19762900, // Math.round(block + (1714417200 - timestamp) / 12), // 1714417200 // April 29 2024 19:00 UTC
        endBlock: 19784310, // Math.round(block + (1714676400 - timestamp) / 12) // 1714676400 // May 2 2024 19:00 UTC
    };

    console.log("round0", round0);

    const round1 = {
        startBlock: 19791450, // Math.round(block + (1714762800 - timestamp) / 12), // 1714762800 // May 3 2024 19:00 UTC
        endBlock: 19812900, // Math.round(block + (1715022000 - timestamp) / 12)// 1715022000 // May 6 2024 19:00 UTC
    };

    console.log("round1", round1);
    
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
