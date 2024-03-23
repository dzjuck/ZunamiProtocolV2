const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');

async function main() {
    console.log('Start deploy');

    const userAddress = '';
    const tokens = [
        '0x0f4bC80018eEcb8D6189E401085dfDAb978432F5',
        '0x979207C927081bC0aeDfc920fD60f11dcB7f2d2f',
        '0x6088d4E45B4490d56d2C850816F2cCE9c20D5CCe',
        '0xc746c0750a1463B5D97A2b018c41f6Df1847E6B4',
        '0xC5A0234Aef260d13ccF8E4FC2967dfF686bE24F5',
    ];

    const tokenFactory = await ethers.getContractFactory('ERC20Token');

    for (let i = 0; i < tokens.length; i++) {
        const tokenAddress = tokens[i];
        const token = await tokenFactory.attach(tokenAddress);
        console.log('Token attached to:', token.address);

        const decimals = await token.decimals();

        // 100 000
        const amount = BigNumber.from(10).pow(decimals + 5);

        let result = await token.transfer(userAddress, amount);
        await result.wait();
        console.log(`User ${userAddress} deposited: ${token.address} for ${amount}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
