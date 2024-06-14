const { ethers } = require('hardhat');

async function main() {
    const newAdmin = '0xb056B9A45f09b006eC7a69770A65339586231a34';
    console.log('New admin:', newAdmin);

    const ownableContractAddresses =[
        // '0x5bA1AF2D13358209A636581252AAe50a3bBCB216',
        // '0x261732D982DcA7385fcc0788e434fAE67746acEA',
        // '0x190B01C325AB18050F13db7e524503336473F931',
        // '0x7ba745D6ee5c19d4284ee6dF5cE3c3Ccf147C283',
        // '0x25488a987CFBe173DAa980B43b6696DC5f8428d4',
        // '0x7bc2c885916a074955E9550F8b25995811a88853',
        '0x51f4594024327fD2E3d4E7BDdD7174237f038F7C'
    ];

    const Ownable2StepFactory = await ethers.getContractFactory('ZunVestingDistributor');

    for (let i = 0; i < ownableContractAddresses.length; i++) {
        const ownable = await Ownable2StepFactory.attach(ownableContractAddresses[i]);
        console.log('Ownable2Step: ', ownable.address);

        const tx = await ownable.transferOwnership(newAdmin);
        await tx.wait();
        console.log('Ownership transfer requested for: ', newAdmin);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
