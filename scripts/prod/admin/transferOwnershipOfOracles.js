const { ethers } = require('hardhat');

async function transferOwnership(newAdmin, contract) {
    let result = await contract.transferOwnership(newAdmin);
    await result.wait();
    console.log('Requested ownership transferring to:', newAdmin);
}

async function main() {
    const newAdmin = '0xb056B9A45f09b006eC7a69770A65339586231a34';

    const GenericOracleFactory = await ethers.getContractFactory('GenericOracle');
    const genericOracle = await GenericOracleFactory.attach(
        '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410'
    );
    console.log('GenericOracle attached to:', genericOracle.address);

    await transferOwnership(newAdmin, genericOracle);

    const CurveLPOracleFactory = await ethers.getContractFactory('CurveLPOracle');
    const curveLPOracle = await CurveLPOracleFactory.attach(
        '0x4DA60AF547c24eBFD5ECC8325E7F24BDb69F1a48'
    );
    console.log('CurveLPOracle attached to:', curveLPOracle.address);

    await transferOwnership(newAdmin, curveLPOracle);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
