import { ethers } from 'hardhat';
import BigNumber from 'bignumber.js';
import { expect } from 'chai';
import chai from 'chai';
import { Contract } from '@ethersproject/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { FakeContract, smock } from '@defi-wonderland/smock';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

import {
  IERC20,
  IPool, IRewardManager,
} from '../../typechain-types';

chai.should(); // if you like should syntax
chai.use(smock.matchers);

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

const mockPool = async () => await smock.fake('IPool') as FakeContract<IPool>;

describe('ZunamiPoolCompoundController', () => {
  let admin: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;
  let rosa: SignerWithAddress;

  let zunamiPool: FakeContract<IPool>;
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
      0
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
    ]

    zunamiPool  = await mockPool();

    const ZunamiController = await ethers.getContractFactory('ZunamiPoolCompoundController', admin);
    zunamiController = await ZunamiController.deploy(zunamiPool.address, 'Zunami APS TEST', 'zunAPSTEST');
    await zunamiController.deployed();
    expect(zunamiController.address).to.properAddress;

    await expect(
      zunamiController.setRewardTokens([])
    ).to.be.revertedWithCustomError(zunamiController,
      `WrongRewardTokens`);

    await zunamiController.setRewardTokens(rewardTokens.map(t => t.address));
  });

  it('should be created rightly', async () => {
    await expect(await zunamiController.rewardTokens(0)).to.be.equal(rewardTokens[0].address);
    await expect(await zunamiController.rewardTokens(1)).to.be.equal(rewardTokens[1].address);
    await expect(await zunamiController.rewardTokens(2)).to.be.equal(rewardTokens[2].address);

    await expect(await zunamiController.managementFeePercent()).to.be.equal(100);
    await expect(await zunamiController.feeTokenId()).to.be.equal(0);
    await expect(await zunamiController.feeDistributor()).to.be.equal(admin.address);

    await expect(await zunamiController.collectedManagementFee()).to.be.equal(0);
    await expect(await zunamiController.rewardManager()).to.be.equal(ADDRESS_ZERO);

    await expect(await zunamiController.paused()).to.be.equal(false);
  });

  it('should be set reward manager', async () => {
    await expect(await zunamiController.rewardManager()).to.be.equal(ADDRESS_ZERO);

    await expect(
      zunamiController.connect(bob).setRewardManager(bob.address)
    ).to.be.revertedWithCustomError(zunamiController,
      `AccessControlUnauthorizedAccount`);

    await zunamiController.connect(admin).setRewardManager(bob.address);

    await expect(await zunamiController.rewardManager()).to.be.equal(bob.address);
  });

  it('should be set default deposit and withdraw strategies', async () => {
    await expect(await zunamiController.defaultDepositSid()).to.be.equal(0);
    await expect(await zunamiController.defaultWithdrawSid()).to.be.equal(0);

    await expect(
      zunamiController.setDefaultDepositSid(1)
    ).to.be.revertedWithCustomError(zunamiController,
      `WrongSid`);

    await expect(
      zunamiController.setDefaultWithdrawSid(1)
    ).to.be.revertedWithCustomError(zunamiController,
      `WrongSid`);

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

    const amount = tokenify(300);
    const minted = amount.minus(MINIMUM_LIQUIDITY);
    await zunamiPool.token.returns(dai.address);
    await zunamiPool.deposit.whenCalledWith(sid, tokenBalances, zunamiController.address).returns(amount.toFixed());
    await zunamiPool.balanceOf.whenCalledWith(zunamiController.address).returns(0);
    await zunamiController.deposit(tokenBalances, bob.address);
    expect(await zunamiController.balanceOf(bob.address)).to.be.equal(minted.toFixed());

    await allowTokensToZunamiController([100, 100, 100, 0, 0]);
    await zunamiPool.deposit.whenCalledWith(sid, tokenBalances, zunamiController.address).returns(amount.toFixed());
    await zunamiPool.balanceOf.whenCalledWith(zunamiController.address).returns(amount.toFixed());
    await zunamiController.deposit(tokenBalances, ADDRESS_ZERO);
    expect(await zunamiController.balanceOf(admin.address)).to.be.equal(amount.toFixed());
  });

  it('should withdraw user funds', async () => {
      let tokenBalances = await allowTokensToZunamiController([100, 100, 100, 0, 0]);

      const sid = 1;

      await zunamiPool.strategyCount.returns(sid + 1);
      await zunamiController.setDefaultDepositSid(sid);

      const deposited = tokenify(300);
      await zunamiPool.token.returns(dai.address);
      await zunamiPool.deposit.whenCalledWith(sid, tokenBalances, zunamiController.address).returns(deposited.toFixed());
      await zunamiPool.balanceOf.whenCalledWith(zunamiController.address).returns(0);
      await zunamiController.deposit(tokenBalances, admin.address);

      expect(await zunamiController.balanceOf(admin.address)).to.be.equal(deposited.minus(MINIMUM_LIQUIDITY).toFixed());


      await zunamiPool.strategyCount.returns(sid + 1);
      await zunamiController.setDefaultWithdrawSid(sid);

      const amount = tokenify(100).toFixed();
      await zunamiPool.token.returns(dai.address);
      await zunamiPool.transferFrom.whenCalledWith(admin.address, zunamiController.address, amount).returns(true);
      await zunamiPool.balanceOf.whenCalledWith(zunamiController.address).returns(deposited.toFixed());

      await zunamiController.approve(zunamiController.address, deposited.toFixed());

      await zunamiController.withdraw(amount, tokenBalances, bob.address);

      zunamiPool.withdraw.atCall(0).should.be.calledWith(sid, amount, tokenBalances, bob.address);
      expect(await zunamiController.balanceOf(admin.address)).to.be.equal(deposited.minus(amount).minus(MINIMUM_LIQUIDITY).toFixed());
      await zunamiPool.balanceOf.whenCalledWith(zunamiController.address).returns(deposited.minus(amount).toFixed());

      const remainder = deposited.minus(amount).minus(MINIMUM_LIQUIDITY);
      await zunamiController.withdraw(remainder.toFixed(), tokenBalances, ADDRESS_ZERO);
      zunamiPool.withdraw.atCall(1).should.be.calledWith(sid, remainder.toFixed(), tokenBalances, admin.address);
      expect(await zunamiController.balanceOf(admin.address)).to.be.equal(0);
    });

  it('should be paused deposits and withdraws', async () => {
    await zunamiController.pause();
    expect(await zunamiController.paused()).to.be.equal(true);

    const amount = tokenify(100).toFixed();
    let tokenBalances = await allowTokensToZunamiController([100, 100, 100, 0, 0]);

    await expect(
      zunamiController.deposit(tokenBalances, bob.address)
    ).to.be.revertedWithCustomError(zunamiController,
      `EnforcedPause`);

    await expect(
      zunamiController.withdraw(amount, tokenBalances, bob.address)
    ).to.be.revertedWithCustomError(zunamiController,
      `EnforcedPause`);

    await zunamiController.unpause();
    expect(await zunamiController.paused()).to.be.equal(false);
  });

  it('should be do nothing on compounding if rewards are empty', async () => {
    await expect(await zunamiController.feeDistributor()).to.be.equal(admin.address);

    await expect(
      zunamiController.connect(bob).autoCompoundAll()
    ).to.be.revertedWithCustomError(zunamiController,
      `ZeroFeeTokenAddress`);

    const rewardManager = await smock.fake('IRewardManager') as FakeContract<IRewardManager>;
    await zunamiController.connect(admin).setRewardManager(rewardManager.address);

    await zunamiPool.token.returns(dai.address);
    await zunamiController.connect(bob).autoCompoundAll();

    zunamiPool.claimRewards.atCall(0).should.be.calledWith(zunamiController.address, [rewardTokens[0].address, rewardTokens[1].address, rewardTokens[2].address]);
    zunamiPool.deposit.should.have.callCount(0);
  });

  it('should be compounded rewards', async () => {
    await expect(await zunamiController.feeDistributor()).to.be.equal(admin.address);

    let tokenBalances = await allowTokensToZunamiController([100, 100, 100, 0, 0]);

    const sid = 1;

    await zunamiPool.strategyCount.returns(sid + 1);
    await zunamiController.setDefaultDepositSid(sid);

    const daiFake = await smock.fake('IERC20') as FakeContract<IERC20>;

    const deposited = tokenify(300);
    await zunamiPool.token.returns(daiFake.address);
    await zunamiPool.deposit.whenCalledWith(sid, tokenBalances, zunamiController.address).returns(deposited.toFixed());
    await zunamiPool.balanceOf.whenCalledWith(zunamiController.address).returns(0);
    await daiFake.transferFrom.whenCalledWith(admin.address, zunamiPool.address, tokenify(100).toFixed()).returns(true);
    await zunamiController.deposit(tokenBalances, admin.address);

    expect(await zunamiController.balanceOf(admin.address)).to.be.equal(deposited.minus(MINIMUM_LIQUIDITY).toFixed());

    for (let i = 0; i < rewardTokens.length; i++) {
      await rewardTokens[i].transfer(zunamiController.address, tokenify(100).toFixed());
    }

    await expect(
      zunamiController.connect(bob).autoCompoundAll()
    ).to.be.revertedWithCustomError(zunamiController,
      `ZeroRewardManager`);

    const rewardManager = await smock.fake('IRewardManager') as FakeContract<IRewardManager>;

    await zunamiController.connect(admin).setRewardManager(rewardManager.address);
    await daiFake.balanceOf.returnsAtCall(1, tokenify(150).toFixed());
    await daiFake.transfer.whenCalledWith(zunamiPool.address, tokenify(150 - 150 * 0.1).toFixed()).returns(true);
    await zunamiController.connect(bob).autoCompoundAll();

    expect(await zunamiController.collectedManagementFee()).to.be.equal(tokenify(150 * 0.1).toFixed());

    zunamiPool.claimRewards.atCall(0).should.be.calledWith(zunamiController.address, [rewardTokens[0].address, rewardTokens[1].address, rewardTokens[2].address]);
    for (let i = 0; i < rewardTokens.length; i++) {
      rewardManager.handle.atCall(i).should.be.calledWith(rewardTokens[i].address, tokenify(100).toFixed(), daiFake.address);
    }
    zunamiPool.deposit.should.have.callCount(2);

    await daiFake.balanceOf.returns(tokenify(150 * 0.1).toFixed());
    await daiFake.transfer.whenCalledWith(admin.address, tokenify(150 * 0.1).toFixed()).returns(true);

    await expect(
      zunamiController.setFeeTokenId(1)
    ).to.be.revertedWithCustomError(zunamiController,
      `FeeMustBeWithdrawn`);

    await expect(
      zunamiController.claimManagementFee()
    ).to.be.emit(zunamiController, `ClaimedManagementFee`).withArgs(daiFake.address, tokenify(150 * 0.1).toFixed());
  });

  it('should be set fee token', async () => {
    await expect(await zunamiController.feeTokenId()).to.be.equal(0);

    await expect(
      zunamiController.setFeeTokenId(3)
    ).to.be.revertedWithCustomError(zunamiController,
      `WrongTokenId`);

    await expect(
      zunamiController.setFeeTokenId(5 + 1)
    ).to.be.revertedWithCustomError(zunamiController,
      `WrongTokenId`);

    await zunamiPool.token.whenCalledWith(3).returns(usdt.address);
    await zunamiController.setFeeTokenId(3);

    await expect(await zunamiController.feeTokenId()).to.be.equal(3);
  });

  it('should be set fee distributor', async () => {
    await expect(await zunamiController.feeDistributor()).to.be.equal(admin.address);

    await expect(
      zunamiController.connect(bob).setFeeDistributor(bob.address)
    ).to.be.revertedWithCustomError(zunamiController,
      `AccessControlUnauthorizedAccount`);

    await expect(
      zunamiController.connect(admin).setFeeDistributor(ADDRESS_ZERO)
    ).to.be.revertedWithCustomError(zunamiController,
      `ZeroAddress`);

    await zunamiController.connect(admin).setFeeDistributor(bob.address);

    await expect(await zunamiController.feeDistributor()).to.be.equal(bob.address);
  });

  it('should be set management fee', async () => {
    await expect(await zunamiController.managementFeePercent()).to.be.equal(100);

    await zunamiPool.token.whenCalledWith(0).returns(dai.address);

    await expect(
      zunamiController.setManagementFeePercent(301)
    ).to.be.revertedWithCustomError(zunamiController,
      `WrongFee`);

    const rewardManager = await smock.fake('IRewardManager') as FakeContract<IRewardManager>;
    await zunamiController.connect(admin).setRewardManager(rewardManager.address);

    await zunamiController.setManagementFeePercent(50);

    await expect(await zunamiController.managementFeePercent()).to.be.equal(50);
  });

  it('should be calculate compound controller token price', async () => {
    // zero supply should revert
    await expect(
      zunamiController.tokenPrice()
    ).to.be.reverted;

    let tokenBalances = await allowTokensToZunamiController([100, 100, 100, 0, 0]);

    const sid = 1;

    await zunamiPool.strategyCount.returns(sid + 1);
    await zunamiController.setDefaultDepositSid(sid);

    const amount = tokenify(300);
    const minted = amount.minus(MINIMUM_LIQUIDITY);
    await zunamiPool.token.returns(dai.address);
    await zunamiPool.deposit.whenCalledWith(sid, tokenBalances, zunamiController.address).returns(amount.toFixed());
    await zunamiPool.balanceOf.whenCalledWith(zunamiController.address).returns(0);
    await zunamiController.deposit(tokenBalances, bob.address);

    expect(await zunamiController.balanceOf(bob.address)).to.be.equal(minted.toFixed());

    // total supply == deposited amount
    await zunamiPool.totalDeposited.returns(amount.toFixed());

    await expect(
      await zunamiController.tokenPrice()
    ).to.be.equal(tokenify(1).toFixed());

    // total supply == deposited amount * 2
    await zunamiPool.totalDeposited.returns(amount.dividedBy(2).toFixed());

    await expect(
      await zunamiController.tokenPrice()
    ).to.be.equal(tokenify(1).dividedBy(2).toFixed());

    // total supply * 2 == deposited amount
    await zunamiPool.totalDeposited.returns(amount.multipliedBy(2).toFixed());

    await expect(
      await zunamiController.tokenPrice()
    ).to.be.equal(tokenify(1).multipliedBy(2).toFixed());
  });
});
