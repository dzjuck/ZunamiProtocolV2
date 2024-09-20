const { ethers } = require('hardhat');

async function grantRoleTo(newAdmin, contract, roleName) {
    const role = await contract[roleName]();
    let result = await contract.grantRole(role, newAdmin);
    await result.wait();
    console.log(
        newAdmin + ' granted ' + roleName + '(' + role + '):',
        await contract.hasRole(role, newAdmin)
    );
}

async function main() {
    const newAdmin = '0xc50222Eb72910322cDf4164cB8A220E2de0468d6';

    const StakingRewardDistributorFactory = await ethers.getContractFactory(
        'LockedStakingRewardDistributor'
    );
    const distributor = await StakingRewardDistributorFactory.attach('0x0030b9c15bC3575ffd1dc96eD3a6548Ee5Ab280F');
    console.log('LockedStakingRewardDistributor:', distributor.address);

    await grantRoleTo(newAdmin, distributor, 'DEFAULT_ADMIN_ROLE');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
