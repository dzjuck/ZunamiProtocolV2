const { ethers } = require('hardhat');
const { GenericOracle } = require('../../../typechain-types');
const {
    attachPoolAndControllerZunUSD,
} = require('../../../../test/utils/AttachPoolAndControllerZunUSD');

async function main() {
    console.log('Start deploy');

    const genericOracleAddress = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
    const GenericOracleFactory = await ethers.getContractFactory('GenericOracle');
    const genericOracle = await GenericOracleFactory.attach(genericOracleAddress);
    console.log('GenericOracle attached to:', genericOracle.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
