const { ethers } = require('hardhat');
const addresses = require("../../../test/address.json");
async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const zunAddr = '0x6b5204b0be36771253cc38e88012e02b752f0f36';
    console.log('ZUN address:', zunAddr);

    const vlZunAddr = '';
    const StakingRewardDistributor = await ethers.getContractFactory('ZUNStakingRewardDistributor');
    const stakingRewardDistributor = await StakingRewardDistributor.attach(vlZunAddr);
    console.log('ZUNStakingRewardDistributor:', stakingRewardDistributor.address);

    // deploy recapitalization manager
    const RecapitalizationManager = await ethers.getContractFactory('RecapitalizationManager');
    const recapitalizationManager = await RecapitalizationManager.deploy(
        zunAddr
    );
    await recapitalizationManager.deployed();
    console.log('RecapitalizationManager deployed to:', recapitalizationManager.address);

    const rewards = [
        addresses.crypto.crv,
        addresses.crypto.cvx,
        addresses.crypto.fxs,
        addresses.crypto.sdt,
    ];
    await recapitalizationManager.setRewardTokens(rewards);
    await recapitalizationManager.setRewardDistributor(stakingRewardDistributor.address);

    await stakingRewardDistributor.grantRole(
        stakingRewardDistributor.DISTRIBUTOR_ROLE(),
        recapitalizationManager.address
    );
    await stakingRewardDistributor.grantRole(
        stakingRewardDistributor.RECAPITALIZATION_ROLE(),
        recapitalizationManager.address
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
