const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');

async function main() {
    console.log('Start deploy');

    const userAddress = '';

    const tokens = ['', '', ''];

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
