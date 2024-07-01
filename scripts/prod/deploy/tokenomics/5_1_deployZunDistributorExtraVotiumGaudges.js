const { ethers } = require('hardhat');

const {parseUnits} = require("ethers/lib/utils");

async function deployVotiumGauge(tokenAddr, votiumAddr, gaugeAddr) {
    const GaugeFactory = await ethers.getContractFactory(
        "VotiumGauge"
    );
    const distributorGauge = await GaugeFactory.deploy(
        tokenAddr,
        votiumAddr,
        gaugeAddr
    );
    await distributorGauge.deployed();
    console.log('VotiumGauge for votium: ', votiumAddr, ' and gauge: ', gaugeAddr, ' deployed to:', distributorGauge.address);
}

async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();
    console.log('Admin:', admin.address);

    const zunAddr = '0x6b5204b0be36771253cc38e88012e02b752f0f36';
    console.log('ZUN address:', zunAddr);

    const votiumAddr = '0x63942E31E98f1833A234077f47880A66136a2D1e';
    const curveGaugeAddr = '0x44f30d79f62a3d5340030d64806cd73239889f07';
    await deployVotiumGauge(zunAddr, votiumAddr, curveGaugeAddr);

    const votiumFxAddr = '0x2272B9a1ce6503f9428E4179eBcdc2690eF28469';
    const fxGaugeAddr = '0x9516c367952430371A733E5eBb587E01eE082F99';
    await deployVotiumGauge(zunAddr, votiumFxAddr, fxGaugeAddr);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
