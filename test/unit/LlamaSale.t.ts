import { ethers, network } from 'hardhat';
import BigNumber from 'bignumber.js';
import { expect } from 'chai';
import chai from 'chai';
import { Contract } from '@ethersproject/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Address } from 'hardhat-deploy/dist/types';
const { mine } = require('@nomicfoundation/hardhat-network-helpers');

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
const parse = ethers.utils.parseEther;

async function transferEthToContract(to: Address, amount: any) {
    const SelfDestructFactory = await ethers.getContractFactory('SelfDestruct');
    const selfDestruct = await SelfDestructFactory.deploy({ value: amount });
    await selfDestruct.transferBalance(to);
}

describe('Llama sale', () => {
    let admin: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let carrol: SignerWithAddress;
    let malicious: SignerWithAddress;

    let llamaSale: Contract;

    before(async () => {
        [admin, alice, bob, carrol, malicious] = await ethers.getSigners();
        const holders = [alice.address, bob.address, carrol.address];
        let latestBlock = await ethers.provider.getBlock('latest');
        console.log('current block - ', latestBlock.number);
        console.log('first round: ', latestBlock.number + 100, ' - ', latestBlock.number + 200);
        console.log('second round: ', latestBlock.number + 300, ' - ', latestBlock.number + 400);
        const firstRound = {
            startBlock: latestBlock.number + 100,
            endBlock: latestBlock.number + 200,
        };
        const secondRound = {
            startBlock: latestBlock.number + 300,
            endBlock: latestBlock.number + 400,
        };
        const LlamaSaleFactory = await ethers.getContractFactory('LlamaSale', admin);
        llamaSale = await LlamaSaleFactory.deploy(admin.address, holders, firstRound, secondRound);
    });

    describe('Unit tests', () => {
        it("shouldn't deposit before round 1", async () => {
            await expect(
                llamaSale.connect(alice).deposit({ value: parse('1') })
            ).to.be.revertedWithCustomError(llamaSale, 'WrongBlock');
        });

        it('should deposit round 1', async () => {
            // start first Round
            await mine(101);
            await llamaSale.connect(alice).deposit({ value: parse('1') });
            expect(await ethers.provider.getBalance(llamaSale.address)).to.be.equal(parse('1'));
        });

        it("shouldn't deposit round 1 if balance + msg.value bigger than maxPersonalBalance", async () => {
            await expect(
                llamaSale.connect(alice).deposit({ value: parse('5.0001') })
            ).to.be.revertedWithCustomError(llamaSale, 'WrongPersonalBalance');
        });

        it("shouldn't deposit round 1 if msg.value bigger than maxPersonalBalance", async () => {
            await expect(
                llamaSale.connect(carrol).deposit({ value: parse('6.0001') })
            ).to.be.revertedWithCustomError(llamaSale, 'WrongPersonalBalance');
        });

        it('should deposit msg.value = maxPersonalBalance', async () => {
            const balanceBefore = await ethers.provider.getBalance(llamaSale.address);
            await llamaSale.connect(carrol).deposit({ value: parse('6') });
            expect(await ethers.provider.getBalance(llamaSale.address)).to.be.equal(
                balanceBefore.add(parse('6'))
            );
        });

        it('should deposit round 1 if msg.sender.balance < 1', async () => {
            const sendingAmount = (await ethers.provider.getBalance(bob.address)).sub(parse('2.0'));
            await bob.sendTransaction({
                to: alice.address,
                value: sendingAmount,
            });
            await llamaSale.connect(bob).deposit({ value: parse('1') });
        });

        it("shouldn't deposit if balance > maxTotalBalance", async () => {
            await transferEthToContract(llamaSale.address, parse('85'));
            await expect(
                llamaSale.connect(alice).deposit({ value: parse('3') })
            ).to.be.revertedWithCustomError(llamaSale, 'WrongTotalBalance');
        });

        it('should make last deposit round 1', async () => {
            await llamaSale.connect(alice).deposit({ value: parse('2') });
            expect(await ethers.provider.getBalance(llamaSale.address)).to.be.equal(parse('95'));
        });

        it("shouldn't deposit zero msg.value", async () => {
            await expect(llamaSale.connect(alice).deposit()).to.be.revertedWithCustomError(
                llamaSale,
                'WrongAmount'
            );
        });

        it("shouldn't deposit if user not a holder", async () => {
            await expect(
                llamaSale.connect(malicious).deposit({ value: parse('1') })
            ).to.be.revertedWithCustomError(llamaSale, 'WrongHolder');
        });

        it("shouldn't deposit between rounds", async () => {
            // end first Round
            await mine(101);
            await expect(
                llamaSale.connect(alice).deposit({ value: parse('1') })
            ).to.be.revertedWithCustomError(llamaSale, 'WrongBlock');
        });

        it("can't deposit second round if not withdraw", async () => {
            // start second round
            await mine(101);
            await expect(
                llamaSale.connect(alice).deposit({ value: parse('1') })
            ).to.be.revertedWithCustomError(llamaSale, 'WrongTotalBalance');
        });

        it('should withdraw from first round', async () => {
            const balanceBeforeAdmin = await ethers.provider.getBalance(admin.address);
            const balanceBeforeSale = await ethers.provider.getBalance(llamaSale.address);
            expect(balanceBeforeSale).to.be.eq(parse('95'));
            await llamaSale.connect(admin).withdraw();
            expect(
                (await ethers.provider.getBalance(admin.address)).sub(balanceBeforeAdmin)
            ).to.be.gte(parse('94.999'));
            expect(await ethers.provider.getBalance(llamaSale.address)).to.be.eq(0);
        });

        it('can deposit second round if first round withdrawn', async () => {
            await llamaSale.connect(alice).deposit({ value: parse('1') });
            expect(await ethers.provider.getBalance(llamaSale.address)).to.be.equal(parse('1'));
        });

        it("can't deposit any balance per user if totalBalance > maxTotalBalance", async () => {
            const balanceBeforeSale = await ethers.provider.getBalance(llamaSale.address);
            await expect(
                llamaSale.connect(carrol).deposit({ value: parse('95') })
            ).to.be.revertedWithCustomError(llamaSale, 'WrongTotalBalance');
        });

        it('can deposit any balance per user', async () => {
            const balanceBeforeSale = await ethers.provider.getBalance(llamaSale.address);
            await llamaSale.connect(carrol).deposit({ value: parse('94') });
            expect(await ethers.provider.getBalance(llamaSale.address)).to.be.equal(parse('95'));
        });

        it('should withdraw from second round', async () => {
            const balanceBeforeAdmin = await ethers.provider.getBalance(admin.address);
            const balanceBeforeSale = await ethers.provider.getBalance(llamaSale.address);
            expect(balanceBeforeSale).to.be.eq(parse('95'));
            await llamaSale.connect(admin).withdraw();
            expect(
                (await ethers.provider.getBalance(admin.address)).sub(balanceBeforeAdmin)
            ).to.be.gte(parse('94.999'));
            expect(await ethers.provider.getBalance(llamaSale.address)).to.be.eq(0);
        });
    });
});
