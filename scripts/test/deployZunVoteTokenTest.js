const { ethers } = require('hardhat');
async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    console.log('Deploy vlZUN Token:');
    const ZunamiVotingToken = await ethers.getContractFactory('ZunamiVotingToken');
    const token = await ZunamiVotingToken.deploy(admin.address);
    await token.deployed();
    console.log('Zunami Voting Token (vlZUN):', token.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
