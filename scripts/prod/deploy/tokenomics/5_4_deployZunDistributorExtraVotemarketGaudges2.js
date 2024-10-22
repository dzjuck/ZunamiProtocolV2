const {ethers} = require('hardhat');

const VOTEMARKET = "0x000000073D065Fc33a3050C2d0E19C393a5699ba"
const WETH_ZUN_BOUNTY_ID = 1;
const zunETH_pxETH_BOUNTY_ID = 41;
const ZUN_ADDRESS = "0x6b5204B0Be36771253Cc38e88012E02B752f0f36"
const GENERIC_ORACLE = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';

async function deployVotemarketGauge(bountyId) {
    const GaugeFactory = await ethers.getContractFactory(
        "VotemarketGauge2"
    );
    const distributorGauge = await GaugeFactory.deploy(
        VOTEMARKET,
        ZUN_ADDRESS,
        bountyId,
        GENERIC_ORACLE
    );
    await distributorGauge.deployed();
    console.log('VotemarketGauge2 for bountyID: ', bountyId, ' deployed to:', distributorGauge.address);
}

async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();
    console.log('Admin:', admin.address);

    console.log('ZUN address:', ZUN_ADDRESS);

    await deployVotemarketGauge(WETH_ZUN_BOUNTY_ID);
    await deployVotemarketGauge(zunETH_pxETH_BOUNTY_ID);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
