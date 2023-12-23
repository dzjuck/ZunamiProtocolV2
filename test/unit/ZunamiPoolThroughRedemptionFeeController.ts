import { ethers } from 'hardhat';
import BigNumber from 'bignumber.js';
import { duration } from '../utils/duration';
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

describe('ZunamiPoolThroughRedemptionFeeController', () => {
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

    const ZunamiController = await ethers.getContractFactory('ZunamiPoolThroughRedemptionFeeController', admin);
    zunamiController = await ZunamiController.deploy(zunamiPool.address);
    await zunamiController.deployed();
    expect(zunamiController.address).to.properAddress;

    await expect(
      zunamiController.setRewardTokens([])
    ).to.be.revertedWithCustomError(zunamiController,
      `WrongRewardTokens`);

    await zunamiController.setRewardTokens(rewardTokens.map(t => t.address));
  });

  it('should be set fee params', async () => {
    await expect(await zunamiController.withdrawFee()).to.be.equal(0);
    await expect(await zunamiController.feeDistributor()).to.be.equal(ADDRESS_ZERO);

    await expect(
      zunamiController.connect(bob).changeWithdrawFee(bob.address)
    ).to.be.revertedWithCustomError(zunamiController,
      `AccessControlUnauthorizedAccount`);

    await expect(
      zunamiController.connect(bob).changeFeeDistributor(bob.address)
    ).to.be.revertedWithCustomError(zunamiController,
      `AccessControlUnauthorizedAccount`);

    await expect(
      zunamiController.connect(admin).changeWithdrawFee((await zunamiController.MAX_FEE()).add(1))
    ).to.be.revertedWithCustomError(zunamiController,
      `FeeWronglyHigh`);

    await expect(
      zunamiController.connect(admin).changeFeeDistributor(ADDRESS_ZERO)
    ).to.be.revertedWithCustomError(zunamiController,
      `ZeroAddress`);

    await zunamiController.connect(admin).changeWithdrawFee(await zunamiController.MAX_FEE());
    await expect(await zunamiController.withdrawFee()).to.be.equal(await zunamiController.MAX_FEE());

    await zunamiController.connect(admin).changeFeeDistributor(bob.address)
    await expect(await zunamiController.feeDistributor()).to.be.equal(bob.address);
  });

  it('should withdraw user funds minus fee', async () => {
      let tokenBalances = await allowTokensToZunamiController([100, 100, 100, 0, 0]);

      const sid = 1;

      await zunamiPool.strategyCount.returns(sid + 1);
      await zunamiController.setDefaultWithdrawSid(sid);

      await zunamiController.connect(admin).changeFeeDistributor(bob.address)
      await zunamiController.connect(admin).changeWithdrawFee(await zunamiController.MAX_FEE());

      const amount = tokenify(100);
      await zunamiPool.tokens.returns([dai.address, usdc.address, usdt.address, ethers.constants.AddressZero, ethers.constants.AddressZero]);

      const withdrawFee = await zunamiController.withdrawFee();
      const feeDenominator = await zunamiController.FEE_DENOMINATOR()
      const nominalFee = amount.multipliedBy(withdrawFee.toString()).dividedBy(feeDenominator.toString());

      await zunamiPool.transferFrom.whenCalledWith(admin.address, zunamiController.address, amount.toFixed()).returns(true);
      await zunamiPool.transfer.whenCalledWith((await zunamiController.feeDistributor()).toString(), nominalFee.toFixed()).returns(true);

      await zunamiController.withdraw(amount.toFixed(), tokenBalances, alice.address);
      zunamiPool.withdraw.atCall(0).should.be.calledWith(sid, amount.minus(nominalFee).toFixed(), tokenBalances, alice.address);
    });
});
