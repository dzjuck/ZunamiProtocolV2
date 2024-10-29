const { ethers } = require('hardhat');

async function main() {
    console.log('Start deploy');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const zunAddr = '0x6b5204b0be36771253cc38e88012e02b752f0f36';
    console.log('ZUN address:', zunAddr);

    const vlZunAddr = '0x45af4F12B46682B3958B297bAcebde2cE2E795c3';
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
        "0xD533a949740bb3306d119CC777fa900bA034cd52", //crv
        "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B", //cvx
    ];
    await recapitalizationManager.setRewardTokens(rewards);
    console.log('Set reward tokens:', rewards);

    await recapitalizationManager.setRewardDistributor(stakingRewardDistributor.address);
    console.log('Set reward distributor:', stakingRewardDistributor.address);

    await stakingRewardDistributor.grantRole(
        stakingRewardDistributor.DISTRIBUTOR_ROLE(),
        recapitalizationManager.address
    );
    console.log('StakingRewardDistributor grant DISTRIBUTOR role:', await stakingRewardDistributor.DISTRIBUTOR_ROLE(), recapitalizationManager.address);

    await stakingRewardDistributor.grantRole(
        stakingRewardDistributor.RECAPITALIZATION_ROLE(),
        recapitalizationManager.address
    );
    console.log('StakingRewardDistributor grant RECAPITALIZATION role:', await stakingRewardDistributor.RECAPITALIZATION_ROLE(), recapitalizationManager.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
