import { ethers, network } from 'hardhat';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from '@ethersproject/contracts';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber } from 'ethers';

export const tokenify = (value: any) => ethers.utils.parseUnits(value, 18);

describe('Vesting', () => {
    let admin: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let carrol: SignerWithAddress;
    let mallroy: SignerWithAddress;

    let vestingWithLock: Contract;
    let vestingWithoutLock: Contract;
    let token: Contract;
    let balances: any[] = [];
    let latestTimestamp: number;
    let durationSeconds: number;

    beforeEach(async () => {
        [admin, alice, bob, carrol, mallroy] = await ethers.getSigners();

        latestTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

        const beneficiaries = [alice.address, bob.address, carrol.address, mallroy.address];
        balances = [tokenify('100'), tokenify('200'), tokenify('300'), tokenify('500')];
        const startTimestampSeconds = latestTimestamp + 3600;
        durationSeconds = 31536000; // 1 year

        const TokenFactory = await ethers.getContractFactory('ERC20Token', admin);
        token = await TokenFactory.deploy(18);

        const VestingFactory = await ethers.getContractFactory('Vesting', admin);
        vestingWithLock = await VestingFactory.deploy(
            beneficiaries,
            balances,
            startTimestampSeconds,
            durationSeconds,
            token.address,
            admin.address
        );

        vestingWithoutLock = await VestingFactory.deploy(
            beneficiaries,
            balances,
            startTimestampSeconds,
            0,
            token.address,
            admin.address
        );

        await token.connect(admin).transfer(vestingWithLock.address, tokenify('1100'));
        await token.connect(admin).transfer(vestingWithoutLock.address, tokenify('1100'));
    });

    describe('Vesting without lock period', () => {
        it("shouldn't release tokens zero tokens if vesting is not started", async () => {
            await vestingWithoutLock.connect(alice).release();
            expect(await token.balanceOf(alice.address)).to.be.eq(0);
            await vestingWithoutLock.connect(bob).release();
            expect(await token.balanceOf(bob.address)).to.be.eq(0);
            await vestingWithoutLock.connect(carrol).release();
            expect(await token.balanceOf(carrol.address)).to.be.eq(0);
            await vestingWithoutLock.connect(mallroy).release();
            expect(await token.balanceOf(mallroy.address)).to.be.eq(0);
        });

        it('should release tokens after vesting start', async () => {
            await time.increase(3601);
            await vestingWithoutLock.connect(alice).release();
            expect(await token.balanceOf(alice.address)).to.be.eq(balances[0]);
            await vestingWithoutLock.connect(bob).release();
            expect(await token.balanceOf(bob.address)).to.be.eq(balances[1]);
            await vestingWithoutLock.connect(carrol).release();
            expect(await token.balanceOf(carrol.address)).to.be.eq(balances[2]);
            await vestingWithoutLock.connect(mallroy).release();
            expect(await token.balanceOf(mallroy.address)).to.be.eq(balances[3]);
        });

        it("shouldn't release twice", async () => {
            await time.increase(3601);
            await vestingWithoutLock.connect(alice).release();
            const balanceBefore = await token.balanceOf(alice.address);
            expect(balanceBefore).to.be.eq(balances[0]);

            await vestingWithoutLock.connect(alice).release();
            const balanceAfter = await token.balanceOf(alice.address);
            expect(balanceBefore).to.be.eq(balanceAfter);
        });
    });

    describe('Vesting with lock period', () => {
        it("shouldn't release tokens zero tokens if vesting is not started", async () => {
            await vestingWithLock.connect(alice).release();
            expect(await token.balanceOf(alice.address)).to.be.eq(0);
            await vestingWithLock.connect(bob).release();
            expect(await token.balanceOf(bob.address)).to.be.eq(0);
            await vestingWithLock.connect(carrol).release();
            expect(await token.balanceOf(carrol.address)).to.be.eq(0);
            await vestingWithLock.connect(mallroy).release();
            expect(await token.balanceOf(mallroy.address)).to.be.eq(0);
        });

        it('should release tokens by schedule', async () => {
            await network.provider.send('evm_setAutomine', [false]);
            await network.provider.send('evm_setIntervalMining', [0]);

            await time.setNextBlockTimestamp(latestTimestamp + 3600); // start timestamp
            await vestingWithLock.connect(alice).release();
            await vestingWithLock.connect(bob).release();
            await vestingWithLock.connect(carrol).release();
            await vestingWithLock.connect(mallroy).release();
            await network.provider.send('evm_mine');

            expect(await token.balanceOf(alice.address)).to.be.eq(0);
            expect(await token.balanceOf(bob.address)).to.be.eq(0);
            expect(await token.balanceOf(carrol.address)).to.be.eq(0);
            expect(await token.balanceOf(mallroy.address)).to.be.eq(0);

            await time.setNextBlockTimestamp(latestTimestamp + 3600 + durationSeconds / 12); // 1 month timestamp
            await vestingWithLock.connect(alice).release();
            await vestingWithLock.connect(bob).release();
            await vestingWithLock.connect(carrol).release();
            await vestingWithLock.connect(mallroy).release();
            await network.provider.send('evm_mine');

            expect(await token.balanceOf(alice.address)).to.be.eq(balances[0].div(12));
            expect(await token.balanceOf(bob.address)).to.be.eq(balances[1].div(12));
            expect(await token.balanceOf(carrol.address)).to.be.eq(balances[2].div(12));
            expect(await token.balanceOf(mallroy.address)).to.be.eq(balances[3].div(12));

            await time.setNextBlockTimestamp(latestTimestamp + 3600 + durationSeconds / 6); // 2 months timestamp
            await vestingWithLock.connect(alice).release();
            await vestingWithLock.connect(bob).release();
            await vestingWithLock.connect(carrol).release();
            await vestingWithLock.connect(mallroy).release();
            await network.provider.send('evm_mine');

            expect(await token.balanceOf(alice.address)).to.be.eq(balances[0].div(6));
            expect(await token.balanceOf(bob.address)).to.be.eq(balances[1].div(6));
            expect(await token.balanceOf(carrol.address)).to.be.eq(balances[2].div(6));
            expect(await token.balanceOf(mallroy.address)).to.be.eq(balances[3].div(6));

            await time.setNextBlockTimestamp(latestTimestamp + 3600 + durationSeconds / 2); // 6 months timestamp
            await vestingWithLock.connect(alice).release();
            await vestingWithLock.connect(bob).release();
            await vestingWithLock.connect(carrol).release();
            await vestingWithLock.connect(mallroy).release();
            await network.provider.send('evm_mine');

            expect(await token.balanceOf(alice.address)).to.be.eq(balances[0].div(2));
            expect(await token.balanceOf(bob.address)).to.be.eq(balances[1].div(2));
            expect(await token.balanceOf(carrol.address)).to.be.eq(balances[2].div(2));
            expect(await token.balanceOf(mallroy.address)).to.be.eq(balances[3].div(2));

            await time.setNextBlockTimestamp(latestTimestamp + 3600 + durationSeconds); // 1 year timestamp
            await vestingWithLock.connect(alice).release();
            await vestingWithLock.connect(bob).release();
            await vestingWithLock.connect(carrol).release();
            await vestingWithLock.connect(mallroy).release();
            await network.provider.send('evm_mine');

            expect(await token.balanceOf(alice.address)).to.be.eq(balances[0].div(1));
            expect(await token.balanceOf(bob.address)).to.be.eq(balances[1].div(1));
            expect(await token.balanceOf(carrol.address)).to.be.eq(balances[2].div(1));
            expect(await token.balanceOf(mallroy.address)).to.be.eq(balances[3].div(1));
        });
    });
});
