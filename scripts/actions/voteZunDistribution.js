const { ethers } = require('hardhat');

const {parseUnits} = require("ethers/lib/utils");
async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();
    console.log('Admin:', admin.address);

    const vouterAddr = '0xb056B9A45f09b006eC7a69770A65339586231a34';

    // start block number
    const START_BLOCK = 20029070;
    console.log('Start block number:', START_BLOCK);

    const VOTING_PERIOD = 7 * 24 * 60 * 60 / 12;
    console.log('Vouting period:', VOTING_PERIOD);

    const zunAddr = '0x6b5204b0be36771253cc38e88012e02b752f0f36';
    console.log('ZUN address:', zunAddr);

    const vlZunAddr = '0x45af4F12B46682B3958B297bAcebde2cE2E795c3';
    const ERC20VotesFactory = await ethers.getContractFactory('ZUNStakingRewardDistributor');
    const vlZunToken = await ERC20VotesFactory.attach(vlZunAddr);
    console.log('vlZUN address:', vlZunToken.address);

    const zunDistributorAddr = '0xEEA950a509d822CF65edcEED53d161fBaa967B3a';
    const ZunDistributorFactory = await ethers.getContractFactory('ZunDistributor');
    const distributor = await ZunDistributorFactory.attach(zunDistributorAddr);
    console.log('ZunDistributor attach to: ', distributor.address);

    const lastFinalizeBlock = (await distributor.lastFinalizeBlock()).toNumber();
    console.log('Last finalize block:', lastFinalizeBlock);

    const borderBlock = lastFinalizeBlock -
        ((lastFinalizeBlock - START_BLOCK) % VOTING_PERIOD);
    console.log('Border block:', borderBlock);

    const votePower = await vlZunToken.getPastVotes(vouterAddr, borderBlock);
    console.log('Vote power:', votePower.toString());

    const percents = [
        25,  // ZUN staking
        6,  // aps zunUSD
        6, // aps zunETH
        15, // curve ZUN/WETH
        13, // votium zunETH/frxETH
        11, // votium zunUSD/fxUSD
        9, // votemarket crvUSD+zunUSD
        6, // votemarket crvUSD+zunUSD Arbitrum
        9, // votemarket zunETH/wETH Arbitrum
    ];

    const indexes = [];
    const amounts = [];
    let totalPercent = 0;
    for (let i = 0; i < percents.length; i++) {
        const percent = percents[i];
        totalPercent += percent;
        indexes.push(i);
        amounts.push(votePower.mul(percent).div(100).toString());
    }
    console.log('Total percent:', totalPercent);

    console.log('Indexes:', indexes);
    console.log('Amounts:', amounts);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
