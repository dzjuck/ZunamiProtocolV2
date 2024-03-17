const { ethers } = require('hardhat');
const {IRewardManager} = require("../../../typechain-types");

async function main() {
    console.log('Start deploy');

    const fraxStakingVaultEarnedViewerAddress = "0x9Ce7c648244F111CCd338Cc5e269C5961ad9B308";

    console.log('Deploy RewardViewer:');
    const RewardViewerFactory = await ethers.getContractFactory('RewardViewer');
    const rewardViewer = await RewardViewerFactory.deploy(fraxStakingVaultEarnedViewerAddress);
    await rewardViewer.deployed();
    console.log('RewardViewer:', rewardViewer.address, " with param: ", fraxStakingVaultEarnedViewerAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
