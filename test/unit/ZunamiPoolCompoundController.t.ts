import { ethers } from 'hardhat';
import BigNumber from 'bignumber.js';
import { expect } from 'chai';
import chai from 'chai';
import { Contract } from '@ethersproject/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { FakeContract, smock } from '@defi-wonderland/smock';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

import {
  IPool,
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
    await zunamiPool.tokens.returns([dai.address, usdc.address, usdt.address, ethers.constants.AddressZero, ethers.constants.AddressZero]);
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
      await zunamiPool.tokens.returns([dai.address, usdc.address, usdt.address, ethers.constants.AddressZero, ethers.constants.AddressZero]);
      await zunamiPool.deposit.whenCalledWith(sid, tokenBalances, zunamiController.address).returns(deposited.toFixed());
      await zunamiPool.balanceOf.whenCalledWith(zunamiController.address).returns(0);
      await zunamiController.deposit(tokenBalances, admin.address);

      expect(await zunamiController.balanceOf(admin.address)).to.be.equal(deposited.minus(MINIMUM_LIQUIDITY).toFixed());


      await zunamiPool.strategyCount.returns(sid + 1);
      await zunamiController.setDefaultWithdrawSid(sid);

      const amount = tokenify(100).toFixed();
      await zunamiPool.tokens.returns([dai.address, usdc.address, usdt.address, ethers.constants.AddressZero, ethers.constants.AddressZero]);
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

  it('should be compounded rewards', async () => {
    await expect(await zunamiController.feeDistributor()).to.be.equal(admin.address);


    let tokenBalances = await allowTokensToZunamiController([100, 100, 100, 0, 0]);

    const sid = 1;

    await zunamiPool.strategyCount.returns(sid + 1);
    await zunamiController.setDefaultDepositSid(sid);

    const deposited = tokenify(300);
    await zunamiPool.tokens.returns([dai.address, usdc.address, usdt.address, ethers.constants.AddressZero, ethers.constants.AddressZero]);
    await zunamiPool.deposit.whenCalledWith(sid, tokenBalances, zunamiController.address).returns(deposited.toFixed());
    await zunamiPool.balanceOf.whenCalledWith(zunamiController.address).returns(0);
    await zunamiController.deposit(tokenBalances, admin.address);

    expect(await zunamiController.balanceOf(admin.address)).to.be.equal(deposited.minus(MINIMUM_LIQUIDITY).toFixed());

    await zunamiController.connect(bob).autoCompoundAll();
  });
});
