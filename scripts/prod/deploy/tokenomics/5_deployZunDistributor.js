const { ethers, upgrades} = require('hardhat');
const {
    ERC20,
    ERC20Votes,
    ApproveGauge,
    TransferGauge,
    StakingRewardDistributor,
    StakingRewardDistributorGauge,
    ZunDistributor
} = require("../../../typechain-types");
const {expect} = require("chai");
const {parseUnits} = require("ethers/lib/utils");
async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();
    console.log('Admin:', admin.address);

    // start block number
    const startBlockNumber = 0;
    console.log('Start block number:', startBlockNumber);

    const zunAddr = '0x6b5204b0be36771253cc38e88012e02b752f0f36';
    const ZUN = await ethers.getContractAt('ERC20Token', zunAddr);
    console.log('ZUN address:', zunAddr);

    const vlZunAddr = '';
    const vlZUN = await ethers.getContractAt('ZUNStakingRewardDistributor', vlZunAddr);
    console.log('vlZUN address:', vlZunAddr);

    await vlZUN.delegate(admin.address);

    const lpAddrs = [
        vlZunAddr,
        "",
        ""
    ];

    const StakingRewardDistributorGaugeFactory = await ethers.getContractFactory(
        'StakingRewardDistributorGauge'
    );

    const lpGauges = [];
    for (let i = 0; i < lpAddrs.length; i++) {
        const lpAddr = lpAddrs[i];

        const stakingRewardDistributorGauge = await StakingRewardDistributorGaugeFactory.deploy(
            ZUN.address,
            lpAddr
        );
        await stakingRewardDistributorGauge.deployed();
        console.log('StakingRewardDistributorGauge deployed to:', stakingRewardDistributorGauge.address);

        lpGauges.push(stakingRewardDistributorGauge);

        await vlZUN
            .connect(admin)
            .grantRole(
                await vlZUN.DISTRIBUTOR_ROLE(),
                stakingRewardDistributorGauge.address
            );
        console.log('StakingRewardDistributor DISTRIBUTOR_ROLE granted to: ', stakingRewardDistributorGauge.address);
    }

    const vlZunPower = parseUnits('6000', 'ether');
    const apsLpPower = parseUnits('2000', 'ether');

    // deploy distributor contract
    const ZunDistributorFactory = await ethers.getContractFactory('ZunDistributor');
    const distributor = await ZunDistributorFactory.deploy(
        ZUN.address,
        vlZUN.address,
        admin.address,
        startBlockNumber,
        (7 * 24 * 60 * 60) / 12, // 7 day in blocks
        [lpGauges[0].address, lpGauges[1].address, lpGauges[2].address],
        [vlZunPower, apsLpPower, apsLpPower]
    );
    await distributor.deployed();
    console.log('ZunDistributor deployed to:', distributor.address);

    await (await ZUN.transfer(distributor.address, parseUnits('32000000', 'ether'))).wait()
    console.log("ZunDistributor ZUN balance: ", await ZUN.balanceOf(distributor.address));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
