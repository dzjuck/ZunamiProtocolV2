import { ethers } from 'hardhat';
import BigNumber from 'bignumber.js';
import { duration } from '../utils/duration';
import { expect } from 'chai';
import chai from 'chai';
import { Contract } from '@ethersproject/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { FakeContract, smock } from '@defi-wonderland/smock';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

import { IPool } from '../../typechain-types';

chai.should(); // if you like should syntax
chai.use(smock.matchers);

const MIN_LOCK_TIME = duration.seconds(86405);
const MINIMUM_LIQUIDITY = 1e3;

export const bn = (num: string | number) => new BigNumber(num);
export const decify = (value: any, decimals: any) =>
    bn(value).times(bn(10).pow(decimals)).integerValue();
export const undecify = (value: any, decimals: any) =>
    bn(value.toString()).dividedBy(bn(10).pow(decimals));
export const tokenify = (value: any) => decify(value, 18);
export const stablify = (value: any) => decify(value, 6);

async function stubToken(decimals: number, admin: SignerWithAddress) {
    const StubToken = await ethers.getContractFactory('ERC20Token', admin);
    const token = await StubToken.deploy(decimals);
    await token.deployed();
    return token;
}

const mockPool = async () => (await smock.fake('IPool')) as FakeContract<IPool>;

describe('ZunamiPoolThroughController', () => {
    let admin: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let carol: SignerWithAddress;
    let rosa: SignerWithAddress;

    let zunamiPool: MockContract<IPool>;
    let zunamiController: Contract;
    let rewardTokens: Contract[];
    let dai: Contract;
    let usdc: Contract;
    let usdt: Contract;

    async function allowTokensToZunamiController(tokenAmounts: number[]) {
        const tokenBalances = [
            tokenify(tokenAmounts[0]).toFixed(),
            stablify(tokenAmounts[1]).toFixed(),
            stablify(tokenAmounts[2]).toFixed(),
            0,
            0,
        ];

        await dai.approve(zunamiController.address, tokenBalances[0]);
        await usdc.approve(zunamiController.address, tokenBalances[1]);
        await usdt.approve(zunamiController.address, tokenBalances[2]);

        return tokenBalances;
    }

    beforeEach(async () => {
        [admin, alice, bob, carol, rosa] = await ethers.getSigners();

        dai = await stubToken(18, admin);
        usdc = await stubToken(6, admin);
        usdt = await stubToken(6, admin);

        rewardTokens = [
            await stubToken(18, admin),
            await stubToken(18, admin),
            await stubToken(18, admin),
        ];

        zunamiPool = await mockPool();

        const ZunamiController = await ethers.getContractFactory(
            'ZunamiPoolThroughController',
            admin
        );
        zunamiController = await ZunamiController.deploy(zunamiPool.address);
        await zunamiController.deployed();
        expect(zunamiController.address).to.properAddress;

        await expect(zunamiController.setRewardTokens([])).to.be.revertedWithCustomError(
            zunamiController,
            `WrongRewardTokens`
        );

        await zunamiController.setRewardTokens(rewardTokens.map((t) => t.address));
    });

    it('should be created rightly', async () => {
        await expect(await zunamiController.rewardTokens(0)).to.be.equal(rewardTokens[0].address);
        await expect(await zunamiController.rewardTokens(1)).to.be.equal(rewardTokens[1].address);
        await expect(await zunamiController.rewardTokens(2)).to.be.equal(rewardTokens[2].address);

        await expect(await zunamiController.rewardCollector()).to.be.equal(admin.address);
        await expect(await zunamiController.onlyIssuerMode()).to.be.equal(false);
        await expect(await zunamiController.paused()).to.be.equal(false);
    });

    it('should be changed reward collector', async () => {
        await expect(await zunamiController.rewardCollector()).to.be.equal(admin.address);

        await expect(
            zunamiController.connect(bob).changeRewardCollector(bob.address)
        ).to.be.revertedWithCustomError(zunamiController, `AccessControlUnauthorizedAccount`);

        await zunamiController.connect(admin).changeRewardCollector(bob.address);

        await expect(await zunamiController.rewardCollector()).to.be.equal(bob.address);
    });

    it('should be claimed rewards', async () => {
        await expect(await zunamiController.rewardCollector()).to.be.equal(admin.address);

        await zunamiController.connect(bob).claimRewards();
        zunamiPool.claimRewards.atCall(0).should.be.calledWith(
            admin.address,
            rewardTokens.map((t) => t.address)
        );
    });

    it('should be set default deposit and withdraw strategies', async () => {
        await expect(await zunamiController.defaultDepositSid()).to.be.equal(0);
        await expect(await zunamiController.defaultWithdrawSid()).to.be.equal(0);

        await expect(zunamiController.setDefaultDepositSid(1)).to.be.revertedWithCustomError(
            zunamiController,
            `WrongSid`
        );

        await expect(zunamiController.setDefaultWithdrawSid(1)).to.be.revertedWithCustomError(
            zunamiController,
            `WrongSid`
        );

        await zunamiPool.strategyCount.returns(2);

        await zunamiController.setDefaultDepositSid(1);
        await zunamiController.setDefaultWithdrawSid(1);

        await expect(await zunamiController.defaultDepositSid()).to.be.equal(1);
        await expect(await zunamiController.defaultWithdrawSid()).to.be.equal(1);
    });

    it('should deposit user funds', async () => {
        let tokenBalances = await allowTokensToZunamiController([100, 100, 100, 0, 0]);

        const sid = 1;

        await zunamiPool.strategyCount.returns(sid + 1);
        await zunamiController.setDefaultDepositSid(sid);

        await zunamiPool.tokens.returns([
            dai.address,
            usdc.address,
            usdt.address,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
        ]);
        await zunamiController.deposit(tokenBalances, bob.address);
        zunamiPool.deposit.atCall(0).should.be.calledWith(sid, tokenBalances, bob.address);

        await allowTokensToZunamiController([100, 100, 100, 0, 0]);
        await zunamiController.deposit(tokenBalances, ADDRESS_ZERO);
        zunamiPool.deposit.atCall(1).should.be.calledWith(sid, tokenBalances, admin.address);
    });

    it('should withdraw user funds', async () => {
        let tokenBalances = await allowTokensToZunamiController([100, 100, 100, 0, 0]);

        const sid = 1;

        await zunamiPool.strategyCount.returns(sid + 1);
        await zunamiController.setDefaultWithdrawSid(sid);

        const amount = tokenify(100).toFixed();
        await zunamiPool.tokens.returns([
            dai.address,
            usdc.address,
            usdt.address,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
        ]);
        await zunamiPool.transferFrom
            .whenCalledWith(admin.address, zunamiController.address, amount)
            .returns(true);

        await zunamiController.withdraw(amount, tokenBalances, bob.address);
        zunamiPool.withdraw.atCall(0).should.be.calledWith(sid, amount, tokenBalances, bob.address);

        await zunamiController.withdraw(amount, tokenBalances, ADDRESS_ZERO);
        zunamiPool.withdraw
            .atCall(1)
            .should.be.calledWith(sid, amount, tokenBalances, admin.address);
    });

    it('should deposit and withdraw only issuer', async () => {
        await zunamiController.setOnlyIssuerMode(true);

        const amount = tokenify(100).toFixed();
        let tokenBalances = await allowTokensToZunamiController([100, 100, 100, 0, 0]);

        await expect(
            zunamiController.deposit(tokenBalances, bob.address)
        ).to.be.revertedWithCustomError(zunamiController, `OnlyIssuer`);

        await expect(
            zunamiController.withdraw(amount, tokenBalances, bob.address)
        ).to.be.revertedWithCustomError(zunamiController, `OnlyIssuer`);

        await zunamiController.grantRole(await zunamiController.ISSUER_ROLE(), admin.address);

        await zunamiPool.tokens.returns([
            dai.address,
            usdc.address,
            usdt.address,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
        ]);
        await zunamiController.connect(admin).deposit(tokenBalances, bob.address);

        await allowTokensToZunamiController([100, 100, 100, 0, 0]);

        await zunamiPool.tokens.returns([
            dai.address,
            usdc.address,
            usdt.address,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
        ]);
        await zunamiPool.transferFrom
            .whenCalledWith(admin.address, zunamiController.address, amount)
            .returns(true);

        await zunamiController.connect(admin).withdraw(amount, tokenBalances, bob.address);
    });

    it('should be paused deposits and withdraws', async () => {
        await zunamiController.pause();

        const amount = tokenify(100).toFixed();
        let tokenBalances = await allowTokensToZunamiController([100, 100, 100, 0, 0]);

        await expect(
            zunamiController.deposit(tokenBalances, bob.address)
        ).to.be.revertedWithCustomError(zunamiController, `EnforcedPause`);

        await expect(
            zunamiController.withdraw(amount, tokenBalances, bob.address)
        ).to.be.revertedWithCustomError(zunamiController, `EnforcedPause`);

        await zunamiController.unpause();

        await zunamiPool.tokens.returns([
            dai.address,
            usdc.address,
            usdt.address,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
        ]);
        await zunamiController.connect(admin).deposit(tokenBalances, bob.address);

        await allowTokensToZunamiController([100, 100, 100, 0, 0]);

        await zunamiPool.tokens.returns([
            dai.address,
            usdc.address,
            usdt.address,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
        ]);
        await zunamiPool.transferFrom
            .whenCalledWith(admin.address, zunamiController.address, amount)
            .returns(true);

        await zunamiController.connect(admin).withdraw(amount, tokenBalances, bob.address);
    });
});
