const { ethers } = require('hardhat');

const {parseUnits} = require("ethers/lib/utils");
async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();
    console.log('Admin:', admin.address);

    // start block number
    const startBlockNumber = 20029070;
    console.log('Start block number:', startBlockNumber);

    const zunAddr = '0x6b5204b0be36771253cc38e88012e02b752f0f36';
    console.log('ZUN address:', zunAddr);

    const vlZunAddr = '0x45af4F12B46682B3958B297bAcebde2cE2E795c3';
    console.log('vlZUN address:', vlZunAddr);

    const lpAddrs = [
        vlZunAddr,
        "0x280D48e85F712e067A16D6b25e7fFe261c0810Bd",
        "0x61b31cF4039D39F2F2909B8cb82cdb8eB5927Cd8",
        '0xdA22f2De17547E3A5CADcC960EB4e9cfDC52e10A'
    ];

    const lpGaudges = [
        'StakingRewardDistributorGauge',
        "StakingRewardDistributorGauge",
        "StakingRewardDistributorGauge",
        'CurveGaugeGauge',
    ];

    const vlZunPower = parseUnits('4000', 'ether');
    const apsLpPower = parseUnits('1500', 'ether');
    const curveZunLpPower = parseUnits('3000', 'ether');

    const lpInitialVotePower = [
        vlZunPower,
        apsLpPower,
        apsLpPower,
        curveZunLpPower
    ];

    const lpGauges = [];
    for (let i = 0; i < lpAddrs.length; i++) {
        const lpAddr = lpAddrs[i];

        const DistributorGaugeFactory = await ethers.getContractFactory(
            lpGaudges[i]
        );

        const distributorGauge = await DistributorGaugeFactory.deploy(
            zunAddr,
            lpAddr
        );
        await distributorGauge.deployed();
        console.log(lpGaudges[i],' for ',lpAddrs[i],' deployed to:', distributorGauge.address);

        lpGauges.push(distributorGauge);

        if(i !== 3) {
            const stakingRewardDistributor = await ethers.getContractAt('ZUNStakingRewardDistributor', lpAddrs[i]);
            await stakingRewardDistributor
                .connect(admin)
                .grantRole(
                    await stakingRewardDistributor.DISTRIBUTOR_ROLE(),
                    distributorGauge.address
                );
            console.log(lpGaudges[i], ' ', lpAddrs[i], ' DISTRIBUTOR_ROLE granted to: ', distributorGauge.address);
        }
    }

    // deploy distributor contract
    const ZunDistributorFactory = await ethers.getContractFactory('ZunDistributor');
    const distributor = await ZunDistributorFactory.deploy(
        zunAddr,
        vlZunAddr,
        admin.address,
        startBlockNumber,
        (7 * 24 * 60 * 60) / 12, // 7 day in blocks
        [lpGauges[0].address, lpGauges[1].address, lpGauges[2].address, lpGauges[3].address],
        lpInitialVotePower
    );
    await distributor.deployed();
    console.log('ZunDistributor deployed to: ', distributor.address);

    // await (await ZUN.transfer(distributor.address, parseUnits('32000000', 'ether'))).wait()
    // console.log("ZunDistributor ZUN balance: ", await ZUN.balanceOf(distributor.address));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
