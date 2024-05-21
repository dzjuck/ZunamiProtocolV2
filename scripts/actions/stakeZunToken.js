const { ethers } = require('hardhat');
async function main() {
    console.log('Start depositing tokens to controller');

    const [admin] = await ethers.getSigners();

    console.log('Admin:', admin.address);

    const zunAddr = '0xbf3127C1554C02f4e60031E29f890a1A700564f6';
    const zunStakingAddress = '0xEfE42F8814Ec988FCd98ec86e737655cE415978A';

    const ERC20TokenFactory = await ethers.getContractFactory('ERC20Token');
    const zunToken = await ERC20TokenFactory.attach(zunAddr);
    console.log('ZUNToken:', zunToken.address);

    const ZunStaking = await ethers.getContractFactory('ZUNStakingRewardDistributor');
    const zunStaking = await ZunStaking.attach(zunStakingAddress);
    console.log('ZUNStakingRewardDistributor:', zunStaking.address);

    const amount = '1000000000000000000000'; // 1000 ZUN
    let tx = await zunToken.approve(zunStaking.address, amount);
    await tx.wait();
    console.log('Approved: ', (await zunToken.allowance(admin.address, zunStaking.address)).toString());

    tx = await zunStaking.deposit(
        amount,
        admin.address
    )
    await tx.wait();

    console.log('Deposited: ', (await zunStaking.balanceOf(admin.address)).toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
