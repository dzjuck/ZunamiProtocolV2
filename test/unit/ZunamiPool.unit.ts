import { ethers } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import BigNumber from 'bignumber.js';
import { duration } from '../utils/duration';
import { expect } from 'chai';
import chai from 'chai';
import {increaseChainTime} from "../utils/IncreaseChainTime";
import { Contract } from '@ethersproject/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {BigNumber as BN} from "@ethersproject/bignumber/lib/bignumber";
import { FakeContract, smock } from '@defi-wonderland/smock';

import {
  IStrategy,
} from '../../typechain-types';

// chai.should(); // if you like should syntax
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

const mockStrategy = async () => await smock.fake('IStrategy') as FakeContract<IStrategy>;

const setTotalHoldings = (strategy: FakeContract<IStrategy>, holdings: any) =>
  strategy.totalHoldings.returns(bn(holdings).toFixed())

describe('ZunamiPool', () => {
  let admin: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let carol: SignerWithAddress;
  let rosa: SignerWithAddress;

  let zunamiPool: Contract;
  let dai: Contract;
  let usdc: Contract;
  let usdt: Contract;

  async function transferTokensToZunamiPool(tokenAmounts: number[]) {
    const tokenBalances = [
      tokenify(tokenAmounts[0]).toFixed(),
      stablify(tokenAmounts[1]).toFixed(),
      stablify(tokenAmounts[2]).toFixed(),
      0,
      0
    ];

    await dai.transfer(zunamiPool.address, tokenBalances[0]);
    await usdc.transfer(zunamiPool.address, tokenBalances[1]);
    await usdt.transfer(zunamiPool.address, tokenBalances[2]);

    return tokenBalances;
  }

  beforeEach(async () => {
    [admin, alice, bob, carol, rosa] = await ethers.getSigners();

    dai = await stubToken(18, admin);
    usdc = await stubToken(6, admin);
    usdt = await stubToken(6, admin);

    const Zunami = await ethers.getContractFactory('ZunamiPool', admin);
    zunamiPool = await Zunami.deploy('Zunami TEST', 'zunTEST');
    await zunamiPool.deployed();
    expect(zunamiPool.address).to.properAddress;

    await zunamiPool.setTokens([dai.address, usdc.address, usdt.address], [1, 1e12, 1e12]);
  });

  it('should be created rightly', async () => {
    await expect((await zunamiPool.tokens())[0]).to.be.equal(dai.address);
    await expect((await zunamiPool.tokens())[1]).to.be.equal(usdc.address);
    await expect((await zunamiPool.tokens())[2]).to.be.equal(usdt.address);
    await expect((await zunamiPool.tokenDecimalsMultipliers())[0]).to.be.equal(1);
    await expect((await zunamiPool.tokenDecimalsMultipliers())[1]).to.be.equal(10 ** 12);
    await expect((await zunamiPool.tokenDecimalsMultipliers())[2]).to.be.equal(10 ** 12);

    await expect(await zunamiPool.strategyCount()).to.be.equal(0);
    await expect(await zunamiPool.totalDeposited()).to.be.equal(0);

    await expect(await zunamiPool.launched()).to.be.equal(false);
    await expect(await zunamiPool.paused()).to.be.equal(false);
  });

  it('should calculate total holdings', async () => {
    await expect(await zunamiPool.totalHoldings()).to.be.equal(0);

    const strategyHoldings1 = decify(1, 0);
    const strategyHoldings2 = decify(1123456, 6);
    const strategyHoldings3 = tokenify(1234231432141234);

    const strategy1 = await mockStrategy();
    const strategy2 = await mockStrategy();
    const strategy3 = await mockStrategy();

    await zunamiPool.addStrategy(strategy1.address);
    await zunamiPool.addStrategy(strategy2.address);
    await zunamiPool.addStrategy(strategy3.address);

    await expect(await zunamiPool.strategyCount()).to.be.equal(3);

    await setTotalHoldings(strategy1, strategyHoldings1);
    await setTotalHoldings(strategy2, strategyHoldings2);
    await setTotalHoldings(strategy3, strategyHoldings3);

    await expect(await zunamiPool.totalHoldings()).to.be.equal(0);

    //only controller can call deposit and withdraw
    await zunamiPool.grantRole(await zunamiPool.CONTROLLER_ROLE(), admin.address);

    const depositedValue = 300;
    const depositedValueAll = 300;
    const tokenBalances = await transferTokensToZunamiPool([depositedValue, depositedValue, depositedValue, 0, 0]);

    const depositedValueToken = tokenify(depositedValueAll).toFixed();
    await strategy1.deposit.whenCalledWith(tokenBalances).returns(depositedValueToken);
    await zunamiPool.deposit(0, tokenBalances, admin.address);

    await transferTokensToZunamiPool([depositedValue, depositedValue, depositedValue, 0, 0]);
    await strategy2.deposit.whenCalledWith(tokenBalances).returns(depositedValueToken);
    await zunamiPool.deposit(1, tokenBalances, admin.address);

    await transferTokensToZunamiPool([depositedValue, depositedValue, depositedValue, 0, 0]);
    await strategy3.deposit.whenCalledWith(tokenBalances).returns(depositedValueToken);
    await zunamiPool.deposit(2, tokenBalances, admin.address);

    const totalHoldings = strategyHoldings1
      .plus(strategyHoldings2)
      .plus(strategyHoldings3)
      .toFixed();

    await expect(await zunamiPool.totalHoldings()).to.be.equal(totalHoldings);
  });

  it('should not pause when not admin or emergency', async () => {
    await expect(
      zunamiPool.connect(alice).pause()
    ).to.be.revertedWithCustomError(zunamiPool,
      `UnauthorizedAccount2Roles`);

    await zunamiPool.grantRole(await zunamiPool.EMERGENCY_ROLE(), alice.address);

    await zunamiPool.connect(alice).pause();

    await expect(await zunamiPool.paused()).to.be.equal(true);

    await zunamiPool.unpause();

    await zunamiPool.grantRole(await zunamiPool.DEFAULT_ADMIN_ROLE(), alice.address);
    await zunamiPool.connect(alice).pause();

    await expect(await zunamiPool.paused()).to.be.equal(true);
  });

  it('should not deposit or withdraw when wrong params or contract state', async () => {

    const lpShares = tokenify(100).toFixed();
    let tokenBalances = await transferTokensToZunamiPool([100, 100, 100, 0, 0]);

    await expect(
      zunamiPool.deposit(0, tokenBalances, admin.address)
    ).to.be.revertedWithCustomError(zunamiPool,
      `AccessControlUnauthorizedAccount`);

    await expect(
      zunamiPool.withdraw(0, lpShares, tokenBalances, admin.address)
    ).to.be.revertedWithCustomError(zunamiPool,
      `AccessControlUnauthorizedAccount`);

    //only controller can call deposit and withdraw
    await zunamiPool.grantRole(await zunamiPool.CONTROLLER_ROLE(), admin.address);

    await expect(
      zunamiPool.deposit(0, tokenBalances, admin.address)
    ).to.be.revertedWithCustomError(zunamiPool, 'AbsentStrategy');

    await expect(
      zunamiPool.withdraw(0, lpShares, tokenBalances, admin.address)
    ).to.be.revertedWithCustomError(zunamiPool, 'AbsentStrategy');

    let sid = 0;
    let strategy = await mockStrategy();
    await zunamiPool.addStrategy(strategy.address);

    await expect(
      zunamiPool.deposit(sid, tokenBalances, admin.address),
    ).to.be.revertedWithCustomError(zunamiPool, 'WrongDeposit');

    await expect(
      zunamiPool.withdraw(sid, lpShares, tokenBalances, admin.address),
    ).to.be.revertedWithCustomError(zunamiPool, 'WrongAmount');

    await zunamiPool.launch();

    sid = 1;
    strategy = await mockStrategy();
    await zunamiPool.addStrategy(strategy.address);

    await expect(
      zunamiPool.deposit(sid, tokenBalances, admin.address),
    ).to.be.revertedWithCustomError(zunamiPool, 'NotStartedStrategy');

    await expect(
      zunamiPool.withdraw(sid, lpShares, tokenBalances, admin.address)
    ).to.be.revertedWithCustomError(zunamiPool, 'NotStartedStrategy');

    const timeAfterLock = BN.from(await time.latest()).add(MIN_LOCK_TIME).toNumber();
    await increaseChainTime(timeAfterLock);

    await zunamiPool.disableStrategy(sid);

    await expect(
      zunamiPool.deposit(sid, tokenBalances, admin.address),
    ).to.be.revertedWithCustomError(zunamiPool, 'DisabledStrategy');

    await expect(
      zunamiPool.withdraw(sid, lpShares, tokenBalances, admin.address),
    ).to.be.revertedWithCustomError(zunamiPool, 'DisabledStrategy');

    await zunamiPool.enableStrategy(sid);

    await expect(
      zunamiPool.deposit(sid, tokenBalances, admin.address),
    ).to.be.revertedWithCustomError(zunamiPool, 'WrongDeposit');

    await expect(
      zunamiPool.withdraw(sid, lpShares, tokenBalances, admin.address),
    ).to.be.revertedWithCustomError(zunamiPool, 'WrongAmount');
  });

  it('should deposit user funds', async () => {
    const strategy = await mockStrategy();
    await zunamiPool.addStrategy(strategy.address);

    const sid = 0;

    await setTotalHoldings(strategy, 0);

    let tokenBalances = await transferTokensToZunamiPool([100, 100, 100, 0, 0]);

    const timeAfterLock = BN.from(await time.latest()).add(MIN_LOCK_TIME).toNumber();
    await increaseChainTime(timeAfterLock);

    //only controller can call deposit and withdraw
    await zunamiPool.grantRole(await zunamiPool.CONTROLLER_ROLE(), admin.address);

    const depositedValue = tokenify(100);
    await strategy.deposit.whenCalledWith(tokenBalances).returns(depositedValue.toFixed());
    await zunamiPool.deposit(sid, tokenBalances, admin.address);

    const lpShares = depositedValue.toFixed();
    const minted = depositedValue.minus(MINIMUM_LIQUIDITY).toFixed();
    expect(await zunamiPool.totalSupply()).to.be.equal(lpShares);
    expect(await zunamiPool.balanceOf(admin.address)).to.be.equal(minted);
    expect((await zunamiPool.strategyInfo(sid)).minted).to.be.equal(lpShares);
    expect(await zunamiPool.totalDeposited()).to.be.equal(depositedValue.toFixed());

    tokenBalances = await transferTokensToZunamiPool([100, 100, 100, 0, 0]);

    const newDepositedValue = tokenify(50);
    await strategy.deposit.whenCalledWith(tokenBalances).returns(newDepositedValue.toFixed());

    const totalSupply = bn((await zunamiPool.totalSupply()).toString());

    const extraHoldings = tokenify(10);
    const enlargedStrategyHoldings = depositedValue.plus(newDepositedValue).plus(extraHoldings);
    await setTotalHoldings(strategy, enlargedStrategyHoldings.toFixed());
    await zunamiPool.deposit(sid, tokenBalances, admin.address);

    const lpSharesExtra = totalSupply
      .multipliedBy(newDepositedValue)
      .dividedToIntegerBy(enlargedStrategyHoldings)
      .toFixed();
    const lpSharesTotal = bn(lpShares).plus(lpSharesExtra);
    expect(await zunamiPool.totalSupply()).to.be.equal(lpSharesTotal.toFixed());
    expect(await zunamiPool.balanceOf(admin.address)).to.be.equal(lpSharesTotal.minus(MINIMUM_LIQUIDITY).toFixed());
    expect((await zunamiPool.strategyInfo(sid)).minted).to.be.equal(lpSharesTotal.toFixed());
    expect(await zunamiPool.totalDeposited()).to.be.equal(
      depositedValue.plus(newDepositedValue).toFixed()
    );
  });

  it('should deposit strategy directly', async () => {
    let tokenBalances = await transferTokensToZunamiPool([100, 100, 100, 0, 0]);

    const sid = 0;

    const strategy = await mockStrategy();
    await zunamiPool.addStrategy(strategy.address);

    await setTotalHoldings(strategy, 0);

    //only controller can call deposit and withdraw
    await zunamiPool.grantRole(await zunamiPool.CONTROLLER_ROLE(), admin.address);

    expect(await dai.balanceOf(strategy.address)).to.be.equal(0);
    expect(await usdc.balanceOf(strategy.address)).to.be.equal(0);
    expect(await usdt.balanceOf(strategy.address)).to.be.equal(0);

    const depositedValue = tokenify(100);
    await strategy.deposit.whenCalledWith(tokenBalances).returns(depositedValue.toFixed());
    await zunamiPool.depositStrategy(sid, tokenBalances);

    expect(await dai.balanceOf(strategy.address)).to.be.equal(tokenify(100).toFixed());
    expect(await usdc.balanceOf(strategy.address)).to.be.equal(stablify(100).toFixed());
    expect(await usdt.balanceOf(strategy.address)).to.be.equal(stablify(100).toFixed());
  });

  it('should withdraw user funds', async () => {
    const strategy = await mockStrategy();
    await zunamiPool.addStrategy(strategy.address);

    const sid = 0;

    await setTotalHoldings(strategy, 0);

    const tokenBalances = await transferTokensToZunamiPool([100, 100, 100, 0, 0]);;

    const timeAfterLock = BN.from(await time.latest()).add(MIN_LOCK_TIME).toNumber();
    await increaseChainTime(timeAfterLock);

    //only controller can call deposit and withdraw
    await zunamiPool.grantRole(await zunamiPool.CONTROLLER_ROLE(), admin.address);

    const depositedValue = tokenify(100);
    await strategy.deposit.whenCalledWith(tokenBalances).returns(depositedValue.toFixed());
    await zunamiPool.deposit(sid, tokenBalances, admin.address);

    let lpShares = depositedValue.dividedToIntegerBy(2).toFixed();

    await strategy.withdraw
      .whenCalledWith(
        admin.address,
        ethers.BigNumber.from(lpShares)
          .mul((1e18).toString())
          .div((await zunamiPool.strategyInfo(sid)).minted.toString())
          .toString(),
        tokenBalances
      )
      .returns(depositedValue.toFixed());

    const totalSupply = bn((await zunamiPool.totalSupply()).toString());
    const totalDeposited = bn((await zunamiPool.totalDeposited()).toString());

    await zunamiPool.withdraw(sid, lpShares, tokenBalances, admin.address);

    const newTotalSupply = totalSupply.minus(lpShares);
    expect(await zunamiPool.totalSupply()).to.be.equal(newTotalSupply.toFixed());
    expect(await zunamiPool.balanceOf(admin.address)).to.be.equal(newTotalSupply.minus(MINIMUM_LIQUIDITY).toFixed());
    expect((await zunamiPool.strategyInfo(sid)).minted).to.be.equal(newTotalSupply.toFixed());

    const userDeposit = totalDeposited.multipliedBy(lpShares).dividedToIntegerBy(totalSupply);
    const newTotalDeposited = depositedValue.minus(userDeposit).toFixed();
    expect(await zunamiPool.totalDeposited()).to.be.equal(newTotalDeposited);

    await strategy.withdraw
      .whenCalledWith(
        admin.address,
        ethers.BigNumber.from(lpShares)
          .sub(MINIMUM_LIQUIDITY)
          .mul((1e18).toString())
          .div((await zunamiPool.strategyInfo(sid)).minted.toString())
          .toString(),
        tokenBalances
      )
      .returns(depositedValue.toFixed());
    lpShares = depositedValue.dividedToIntegerBy(2).minus(MINIMUM_LIQUIDITY).toFixed();
    await zunamiPool.withdraw(sid, lpShares, tokenBalances, admin.address);

    expect(await zunamiPool.totalSupply()).to.be.equal(MINIMUM_LIQUIDITY);
    expect(await zunamiPool.balanceOf(admin.address)).to.be.equal(0);
    expect((await zunamiPool.strategyInfo(sid)).minted).to.be.equal(MINIMUM_LIQUIDITY);
    expect(await zunamiPool.totalDeposited()).to.be.equal(MINIMUM_LIQUIDITY);
  });

  it('should use launched when starting pool', async () => {
    await expect(await zunamiPool.launched()).to.be.equal(false);

    const strategy = await mockStrategy();
    await zunamiPool.addStrategy(strategy.address);

    expect((await zunamiPool.strategyInfo(0)).startTime).to.be.equal(await time.latest());

    await zunamiPool.launch();
    await expect(await zunamiPool.launched()).to.be.equal(true);

    const strategy2 = await mockStrategy();
    const creationTime = await time.latest();
    await zunamiPool.addStrategy(strategy2.address);

    const transactionDelay = 4; // seconds
    const startTime = BN.from(creationTime).add(MIN_LOCK_TIME).toNumber() - transactionDelay;
    expect((await zunamiPool.strategyInfo(1)).startTime).to.be.equal(startTime);
  });

  it('should move a part of the funds from one strategy to others', async () => {
    const strategy1 = await mockStrategy();
    const strategy2 = await mockStrategy();
    await zunamiPool.addStrategy(strategy1.address);
    await zunamiPool.addStrategy(strategy2.address);

    const sid = 0;

    const tokenBalances = await transferTokensToZunamiPool([100, 100, 100, 0, 0]);

    //only controller can call deposit and withdraw
    await zunamiPool.grantRole(await zunamiPool.CONTROLLER_ROLE(), admin.address);

    const depositedValue = tokenify(300);
    await strategy1.deposit.whenCalledWith(tokenBalances).returns(depositedValue.toFixed());
    await zunamiPool.deposit(sid, tokenBalances, admin.address);

    expect((await zunamiPool.strategyInfo(0)).minted).to.be.equal(depositedValue.toFixed());

    const withdrawHalfPercent = tokenify(0.5).toFixed();
    await strategy1.withdraw
      .whenCalledWith(
        zunamiPool.address,
        withdrawHalfPercent,
        [0, 0, 0, 0, 0]
      )
      .returns(depositedValue.div(2));

    await expect(
      zunamiPool.connect(admin).moveFundsBatch([0], [withdrawHalfPercent], 1, [[0,0,0,0,0]])
    ).to.be.revertedWithCustomError(zunamiPool,
      `WrongDeposit`);

    await strategy2.deposit.whenCalledWith([0, 0, 0, 0, 0]).returns(depositedValue.toFixed());

    await expect(
      zunamiPool.connect(admin).moveFundsBatch([0], [tokenify(0).toFixed()], 1, [[0,0,0,0,0]])
    ).to.be.revertedWithCustomError(zunamiPool,
      `WrongWithdrawPercent`);

    await expect(
      zunamiPool.connect(admin).moveFundsBatch([0], [tokenify(1).plus(1).toFixed()], 1, [[0,0,0,0,0]])
    ).to.be.revertedWithCustomError(zunamiPool,
      `WrongWithdrawPercent`);


    await zunamiPool.connect(admin).moveFundsBatch([0], [withdrawHalfPercent], 1, [[0,0,0,0,0]]);

    expect((await zunamiPool.strategyInfo(0)).minted).to.be.equal(tokenify(150).toFixed());
    expect((await zunamiPool.strategyInfo(1)).minted).to.be.equal(tokenify(150).toFixed());

    await strategy1.deposit.whenCalledWith([0, 0, 0, 0, 0]).returns(depositedValue.toFixed());
    await strategy2.withdrawAll.returns();
    await zunamiPool.connect(admin).moveFundsBatch([1], [tokenify(1).toFixed()], 0, [[0,0,0,0,0]]);

    expect((await zunamiPool.strategyInfo(0)).minted).to.be.equal(tokenify(300).toFixed());
    expect((await zunamiPool.strategyInfo(1)).minted).to.be.equal(tokenify(0).toFixed());
  });
});
