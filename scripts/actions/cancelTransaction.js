const { ethers } = require('hardhat');

async function main() {
    const gasPrice = ethers.utils.parseUnits('20', 'gwei');

    const nonce = 0;
    const [sender] = await ethers.getSigners();

    const transactionObject = {
        to: sender.address,
        value: ethers.utils.parseEther('0'),
        gasPrice: gasPrice,
        nonce: nonce,
    };

    console.log(JSON.stringify(transactionObject));

    await sender.sendTransaction(transactionObject);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
