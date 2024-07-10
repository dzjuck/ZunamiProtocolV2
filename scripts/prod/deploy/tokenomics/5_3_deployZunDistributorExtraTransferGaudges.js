const { ethers } = require('hardhat');

const {parseUnits} = require("ethers/lib/utils");

async function deployTransferGauge(tokenAddr, receiverAddr) {
    const GaugeFactory = await ethers.getContractFactory(
        "TransferGauge"
    );
    const distributorGauge = await GaugeFactory.deploy(
        tokenAddr,
        receiverAddr
    );
    await distributorGauge.deployed();
    console.log('TransferGauge for receiver: ', receiverAddr, ' deployed to:', distributorGauge.address);
}

async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();
    console.log('Admin:', admin.address);

    const zunAddr = '0x6b5204b0be36771253cc38e88012e02b752f0f36';
    console.log('ZUN address:', zunAddr);

    const receiverAddr = '0xb056B9A45f09b006eC7a69770A65339586231a34';
    console.log('Receiver address:', receiverAddr);

    await deployTransferGauge(zunAddr, receiverAddr);
    await deployTransferGauge(zunAddr, receiverAddr);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
