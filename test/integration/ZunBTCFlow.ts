import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { expect } from "chai";

import { abi as erc20ABI } from "../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";

import { increaseChainTime } from "../utils/IncreaseChainTime";
import { createAndInitConicOracles } from "../utils/CreateAndInitConicOracles";
import { createStrategies } from "../utils/CreateStrategies";
import { createPoolAndControllerZunBTC } from "../utils/CreatePoolAndControllerZunBTC";
import { createBtcCoins } from "../utils/CreateBtcCoins";
import { mintBtcCoins } from "../utils/MintBtcCoins";
import { createRewardManager } from "../utils/CreateRewardManager";
import { setupTokenConverterBTCs } from "../utils/SetupTokenConverter";
import { getMinAmountZunBTC } from "../utils/GetMinAmountZunBTC";

const wBtc_tBtc_pool_addr = "0xB7ECB2AA52AA64a717180E030241bC75Cd946726";

describe("ZunBTC flow tests", () => {
  const strategyNames = ["ZunBTCVaultStrat", "WBtcTBtcConvexCurveStrat"];

  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [admin, alice, bob, feeCollector] = await ethers.getSigners();

    const { wBtc, tBtc } = createBtcCoins(admin);

    await mintBtcCoins(admin, wBtc, tBtc);

    const { curveRegistryCache, chainlinkOracle, genericOracle, curveLPOracle } =
      await createAndInitConicOracles([wBtc_tBtc_pool_addr]);

    const WBTCOracleFactory = await ethers.getContractFactory('WBTCOracle');
    const wBTCOracle = await WBTCOracleFactory.deploy(genericOracle.address);
    await genericOracle.setCustomOracle(wBtc.address, wBTCOracle.address);

    const { zunamiPool, zunamiPoolController } = await createPoolAndControllerZunBTC();

    const { tokenConverter, rewardManager } = await createRewardManager(genericOracle.address);

    await setupTokenConverterBTCs(tokenConverter);

    const strategies = await createStrategies(
      strategyNames,
      genericOracle,
      zunamiPool,
      tokenConverter,
      undefined,
      undefined
    );

    for (let i = 1; i < strategies.length; i++) {
      await strategies[i].setSlippage(100);
    }

    const tokenApprovedAmount = "100";

    for (const user of [admin, alice, bob]) {
      await wBtc
        .connect(user)
        .approve(zunamiPoolController.address, parseUnits(tokenApprovedAmount, 8));
      await tBtc
        .connect(user)
        .approve(zunamiPoolController.address, parseUnits(tokenApprovedAmount, "ether"));
    }

    const tokenAmount = "10";

    for (const user of [alice, bob]) {
      await wBtc.transfer(user.getAddress(), ethers.utils.parseUnits(tokenAmount, 8));
      await tBtc.transfer(user.getAddress(), ethers.utils.parseUnits(tokenAmount, "ether"));
    }

    return {
      admin,
      alice,
      bob,
      feeCollector,
      zunamiPool,
      zunamiPoolController,
      strategies,
      rewardManager,
      curveRegistryCache,
      curveLPOracle,
      chainlinkOracle,
      genericOracle,
      wBtc,
      tBtc
    };
  }

  it.only("should deposit assets", async () => {
    const { admin, alice, bob, zunamiPool, zunamiPoolController, strategies, wBtc, tBtc } =
      await loadFixture(deployFixture);

    for (let poolId = 0; poolId < strategies.length; poolId++) {
      await zunamiPool.addStrategy(strategies[poolId].address);
      await zunamiPoolController.setDefaultDepositSid(poolId);
      await zunamiPoolController.setDefaultWithdrawSid(poolId);

      for (let i = 0; i < 2; i++) {
        for (const user of [admin, alice, bob]) {
          const wBtcBefore = await wBtc.balanceOf(user.getAddress());
          const tBtcBefore = await tBtc.balanceOf(user.getAddress());
          const zStableBefore = await zunamiPool.balanceOf(user.getAddress());

          console.log("amounts: ", getMinAmountZunBTC("1"));

          await expect(
            zunamiPoolController
              .connect(user)
              .deposit(getMinAmountZunBTC("1"), await user.getAddress())
          ).to.emit(zunamiPool, "Deposited");

          expect(await wBtc.balanceOf(user.getAddress())).to.lt(wBtcBefore);
          expect(await tBtc.balanceOf(user.getAddress())).to.lt(tBtcBefore);
          const stableDiff = (await zunamiPool.balanceOf(user.getAddress())).sub(
            zStableBefore
          );
          expect(stableDiff).to.gt(0);
          expect(stableDiff).to.gt("1999999999900000000");
        }
      }
    }
  });

  it("should withdraw assets", async () => {
    const { alice, bob, zunamiPool, zunamiPoolController, strategies } = await loadFixture(
      deployFixture
    );

    for (let poolId = 0; poolId < strategies.length; poolId++) {
      await zunamiPool.addStrategy(strategies[poolId].address);
      await zunamiPoolController.setDefaultDepositSid(poolId);
      await zunamiPoolController.setDefaultWithdrawSid(poolId);

      for (const user of [alice, bob]) {
        const stableBefore = await zunamiPool.balanceOf(user.getAddress());

        await expect(
          zunamiPoolController
            .connect(user)
            .deposit(getMinAmountZunBTC("1"), user.getAddress())
        ).to.emit(zunamiPool, "Deposited");

        let stableAmount = BigNumber.from(await zunamiPool.balanceOf(user.getAddress()));

        const stableDiff = stableAmount.sub(stableBefore);
        expect(stableDiff).to.gt(0);
        expect(stableDiff).to.gt("1999999999900000000");

        await zunamiPool.connect(user).approve(zunamiPoolController.address, stableAmount);

        await expect(
          zunamiPoolController
            .connect(user)
            .withdraw(stableAmount, [0, 0, 0, 0, 0], user.getAddress())
        ).to.emit(zunamiPool, "Withdrawn");
        stableAmount = BigNumber.from(await zunamiPool.balanceOf(user.getAddress()));
        expect(stableAmount).to.eq(0);
      }
    }
  });

  it("should claim and withdraw all rewards", async () => {
    const { admin, alice, zunamiPool, zunamiPoolController, strategies } = await loadFixture(
      deployFixture
    );

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      await zunamiPool.addStrategy(strategy.address);

      await zunamiPoolController.setDefaultDepositSid(i);
      await zunamiPoolController.setDefaultWithdrawSid(i);

      await expect(
        zunamiPoolController
          .connect(alice)
          .deposit(getMinAmountZunBTC("1"), admin.getAddress())
      ).to.emit(zunamiPool, "Deposited");
    }

    await increaseChainTime(3600 * 24 * 7);

    await zunamiPoolController.claimRewards();

    await expect(zunamiPool.balanceOf(zunamiPoolController.address)).to.not.eq(0);

    let tokens;
    let balance;
    for (let strategy of strategies) {
      if (!strategy.token) {
        continue;
      }
      const config = await strategy.config();
      if (config.rewards) {
        tokens = [await strategy.token(), ...config.rewards].map(
          (token) => new ethers.Contract(token, erc20ABI, admin)
        );
      } else {
        tokens = [await strategy.token(), config.crv, config.cvx].map(
          (token) => new ethers.Contract(token, erc20ABI, admin)
        );
      }

      for (let token of tokens) {
        balance = await token.balanceOf(strategy.address);
        expect(balance).to.eq(0);
      }
    }
  });

  it("should moveFunds only to not outdated pool", async () => {
    const { admin, alice, zunamiPool, zunamiPoolController, strategies } = await loadFixture(
      deployFixture
    );

    const poolSrc = 0;
    const poolDst = 1;
    const percentage = ethers.utils.parseUnits("1", "ether"); // 1e18

    for (let poolId = 0; poolId < 2; poolId++) {
      await zunamiPool.addStrategy(strategies[poolId].address);
    }

    await zunamiPoolController.setDefaultDepositSid(poolSrc);
    await zunamiPoolController.setDefaultWithdrawSid(poolSrc);

    await expect((await zunamiPool.strategyInfo(poolSrc)).minted).to.be.eq(0);
    await expect(
      zunamiPoolController
        .connect(alice)
        .deposit(getMinAmountZunBTC("1"), admin.getAddress())
    ).to.emit(zunamiPool, "Deposited");
    await expect((await zunamiPool.strategyInfo(poolSrc)).minted).to.be.gt(0);

    console.log(
      "(await zunamiPool.strategyInfo(poolSrc)).minted",
      (await zunamiPool.strategyInfo(poolSrc)).minted
    );
    console.log(
      "(await zunamiPool.strategyInfo(poolDst)).minted",
      (await zunamiPool.strategyInfo(poolDst)).minted
    );
    await expect((await zunamiPool.strategyInfo(poolSrc)).minted).to.be.gt(0);
    await expect((await zunamiPool.strategyInfo(poolDst)).minted).to.be.eq(0);
    await expect(
      zunamiPool.moveFundsBatch([poolSrc], [percentage], poolDst, [[0, 0, 0, 0, 0]])
    );
    console.log(
      "(await zunamiPool.strategyInfo(poolSrc)).minted",
      (await zunamiPool.strategyInfo(poolSrc)).minted
    );
    console.log(
      "(await zunamiPool.strategyInfo(poolDst)).minted",
      (await zunamiPool.strategyInfo(poolDst)).minted
    );

    await expect((await zunamiPool.strategyInfo(poolSrc)).minted).to.be.eq(0);
    await expect((await zunamiPool.strategyInfo(poolDst)).minted).to.be.gt(0);


    await expect(
      zunamiPool.moveFundsBatch([poolDst], [percentage], poolSrc, [[0, 0, 0, 0, 0]])
    );

    console.log(
      "(await zunamiPool.strategyInfo(poolSrc)).minted",
      (await zunamiPool.strategyInfo(poolSrc)).minted
    );
    console.log(
      "(await zunamiPool.strategyInfo(poolDst)).minted",
      (await zunamiPool.strategyInfo(poolDst)).minted
    );

    await expect((await zunamiPool.strategyInfo(poolSrc)).minted).to.be.gt(0);
    await expect((await zunamiPool.strategyInfo(poolDst)).minted).to.be.eq(0);
  });
});
