const { ethers} = require('hardhat');
const { BigNumber } = require('ethers');

const {parseUnits} = require("ethers/lib/utils");
async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();
    console.log('Admin:', admin.address);

    const zunDistributorAddr = '0xEEA950a509d822CF65edcEED53d161fBaa967B3a';
    const ZunDistributorFactory = await ethers.getContractFactory('ZunDistributor');
    const distributor = await ZunDistributorFactory.attach(zunDistributorAddr);
    console.log('ZunDistributor attach to: ', distributor.address);

    const gauges = [];
    let finalizedVotesTotal = BigNumber.from(0);
    let currentVotesTotal = BigNumber.from(0);
    for (let i = 0; i < 8; i++) {
        const gauge = await distributor.gauges(i);
        gauges.push(gauge);
        finalizedVotesTotal = finalizedVotesTotal.add(gauge.finalizedVotes);
        currentVotesTotal = currentVotesTotal.add(gauge.currentVotes);
    }
    console.log('finalizedVotesTotal:', finalizedVotesTotal.toString());
    console.log('currentVotesTotal:', currentVotesTotal.toString());
    const divider = 10_000;
    for (let i = 0; i < gauges.length; i++) {
        console.log('Gauge ', i, ' :');
        console.log(' -- previous percent :', Number(gauges[i].finalizedVotes.mul(divider).div(finalizedVotesTotal).toString()) / divider * 100);
        console.log(' -- current percent :', Number(gauges[i].currentVotes.mul(divider).div(currentVotesTotal).toString()) / divider * 100);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
