import {ethers, network, upgrades} from 'hardhat';
import {impersonateAccount, loadFixture, reset, setBalance, time,} from '@nomicfoundation/hardhat-network-helpers';
import {BigNumber, Signer} from 'ethers';
import {parseUnits} from 'ethers/lib/utils';
import {expect} from 'chai';

import {
  setupTokenConverterETHs,
  setupTokenConverterRewards,
  setupTokenConverterWEthPxEthAndReverse
} from '../utils/SetupTokenConverter';
import {attachTokens} from '../utils/AttachTokens';
import {createStrategies} from '../utils/CreateStrategies';
import {mintEthCoins} from '../utils/MintEthCoins';
import {attachPoolAndControllerZunETH} from '../utils/AttachPoolAndControllerZunETH';
import {getMinAmountZunETH} from '../utils/GetMinAmountZunETH';

import {
  GenericOracle,
  ITokenConverter,
  StakingRewardDistributor,
  ZunamiDepositZap,
  ZunamiPool,
  ZunamiPoolCompoundController,
  ZunamiStableZap2,
} from '../../typechain-types';

import * as addresses from '../address.json';
import {deployRewardManager} from '../utils/DeployRewardManager';

import {FORK_BLOCK_NUMBER, PROVIDER_URL} from "../../hardhat.config";
import {mintTokenTo} from "../utils/MintTokenTo";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
const MINIMUM_LIQUIDITY = 1e3;

export async function createPoolAndCompoundController(token: string, rewardManager: string) {
    const ZunamiPoolFactory = await ethers.getContractFactory('ZunamiPool');
    const zunamiPool = (await ZunamiPoolFactory.deploy('APS', 'APS')) as ZunamiPool;

    await zunamiPool.setTokens(
        [token, ADDRESS_ZERO, ADDRESS_ZERO, ADDRESS_ZERO, ADDRESS_ZERO],
        [1, 0, 0, 0, 0]
    );

    const ZunamiPooControllerFactory = await ethers.getContractFactory(
        'ZunamiPoolCompoundController'
    );
    const zunamiPoolController = (await ZunamiPooControllerFactory.deploy(
        zunamiPool.address,
        'APS LP',
        'APSLP'
    )) as ZunamiPoolCompoundController;

    if (rewardManager) {
        await zunamiPoolController.setRewardManager(rewardManager);
    }

    await zunamiPoolController.setFeeTokenId(0);

    await zunamiPoolController.setRewardTokens([
        addresses.crypto.crv,
        addresses.crypto.cvx,
        addresses.crypto.fxs,
        addresses.crypto.sdt,
        addresses.crypto.zunETH,
    ]);
    await zunamiPool.grantRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address);
    return { zunamiPool, zunamiPoolController };
}

async function setCustomOracle(
    genericOracle: GenericOracle,
    admin: string,
    token: string,
    oracle: string
) {
    await impersonateAccount(admin);
    const impersonatedSigner = await ethers.getSigner(admin);

    // set balance to cover any tx costs
    await setBalance(admin, ethers.utils.parseEther('2').toHexString());

    await genericOracle.connect(impersonatedSigner).setCustomOracle(token, oracle);
}

async function setPoolWithdrawSid(admin: SignerWithAddress, zunamiPoolController: ZunamiPoolThroughController, withdrawSid: number) {

  const zunamiAdmin = "0xb056B9A45f09b006eC7a69770A65339586231a34";

  //fund vault with eth
  await admin.sendTransaction({
    to: zunamiAdmin,
    value: ethers.utils.parseEther('1'),
  });

  await network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [zunamiAdmin],
  });
  const zunamiAdminSigner: Signer = ethers.provider.getSigner(zunamiAdmin);

  await zunamiPoolController.connect(zunamiAdminSigner).setDefaultWithdrawSid(withdrawSid);

  await network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [zunamiAdmin],
  });
}

describe('ZunETH APS flow tests', () => {
    const strategyApsNames = [
        'ZunETHApsVaultStrat',
        'ZunEthPxEthApsStakeDaoCurveStrat',
        'ZunEthFrxEthApsStakingConvexCurveStrat',
        'ZunEthFrxEthApsConvexCurveStrat',
        'ZunEthFrxEthApsStakeDaoCurveStrat',
    ];

    async function deployFixture() {
        await reset(PROVIDER_URL, 20655000);

        // Contracts are deployed using the first signer/account by default
        const [admin, alice, bob, carol, feeCollector] = await ethers.getSigners();

        const { frxEth, wEth } = attachTokens(admin);

        await mintEthCoins(admin, wEth);

        const genericOracleAddress = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
        const GenericOracleFactory = await ethers.getContractFactory('GenericOracle');
        const genericOracle = (await GenericOracleFactory.attach(
            genericOracleAddress
        )) as GenericOracle;

        const curveRouterAddr = '0xF0d4c12A5768D806021F80a262B4d39d26C58b8D';
        const TokenConverterFactory = await ethers.getContractFactory('TokenConverter');
        const tokenConverter = (await TokenConverterFactory.deploy(
            curveRouterAddr
        )) as ITokenConverter;

        await setupTokenConverterETHs(tokenConverter);
        await setupTokenConverterRewards(tokenConverter);
        await setupTokenConverterWEthPxEthAndReverse(tokenConverter);

        const rewardManager = await deployRewardManager(
            tokenConverter.address,
            genericOracleAddress
        );

        const zunETHPoolAddress = '0xc2e660C62F72c2ad35AcE6DB78a616215E2F2222';
        const zunETHPoolControllerAddress = '0x54A00DA65c79DDCe24E7fe4691737FD70F7797DF';

        const { zunamiPool, zunamiPoolController } = await attachPoolAndControllerZunETH(
            zunETHPoolAddress,
            zunETHPoolControllerAddress
        );

        const zunamiAdminAddress = '0xe9b2B067eE106A6E518fB0552F3296d22b82b32B';

        const sdtAddress = '0x73968b9a57c6E53d41345FD57a6E6ae27d6CDB2F';
        const SdtOracleFactory = await ethers.getContractFactory('SdtOracle');
        const sdtOracle = await SdtOracleFactory.deploy(genericOracleAddress);
        await sdtOracle.deployed();

        await setCustomOracle(
          genericOracle,
          zunamiAdminAddress,
          sdtAddress,
          sdtOracle.address
        );

        const ZunEthOracleFactory = await ethers.getContractFactory('ZunEthOracle');
        const zunEthOracle = await ZunEthOracleFactory.deploy(genericOracleAddress);
        await zunEthOracle.deployed();

        await setCustomOracle(
            genericOracle,
            zunamiAdminAddress,
            zunETHPoolAddress,
            zunEthOracle.address
        );

        const StaticCurveLPOracleFactory = await ethers.getContractFactory('StaticCurveLPOracle');

        const ZUNFRXETHPoolAddress = '0x3A65cbaebBFecbeA5D0CB523ab56fDbda7fF9aAA';
        let staticCurveLPOracle = await StaticCurveLPOracleFactory.deploy(
            genericOracleAddress,
            [zunETHPoolAddress, addresses.crypto.frxETH],
            [18, 18],
            ZUNFRXETHPoolAddress
        );
        await staticCurveLPOracle.deployed();

        await setCustomOracle(
            genericOracle,
            zunamiAdminAddress,
            ZUNFRXETHPoolAddress,
            staticCurveLPOracle.address
        );


        const ZUNPXETHPoolAddress = '0x17D964DA2bD337CfEaEd30a27c9Ab6580676E730';
        staticCurveLPOracle = await StaticCurveLPOracleFactory.deploy(
          genericOracleAddress,
          [zunETHPoolAddress, addresses.crypto.pxETH],
          [18, 18],
          ZUNPXETHPoolAddress
        );
        await staticCurveLPOracle.deployed();

        await setCustomOracle(
          genericOracle,
          zunamiAdminAddress,
          ZUNPXETHPoolAddress,
          staticCurveLPOracle.address
        );


        const { zunamiPool: zunamiPoolAps, zunamiPoolController: zunamiPoolControllerAps } =
            await createPoolAndCompoundController(zunamiPool.address, rewardManager.address);

        const strategiesAps = await createStrategies(
            strategyApsNames,
            genericOracle,
            zunamiPoolAps,
            tokenConverter,
            [zunamiPool.address, ADDRESS_ZERO, ADDRESS_ZERO, ADDRESS_ZERO, ADDRESS_ZERO],
            [1, 0, 0, 0, 0]
        );

        const tokenApprovedAmount = '10000';

        for (const user of [admin, alice, bob]) {
            await wEth
                .connect(user)
                .approve(zunamiPoolController.address, parseUnits(tokenApprovedAmount, 'ether'));
            await frxEth
                .connect(user)
                .approve(zunamiPoolController.address, parseUnits(tokenApprovedAmount, 'ether'));
        }

        const tokenAmount = '100';

        for (const user of [alice, bob]) {
            await wEth.transfer(user.getAddress(), ethers.utils.parseUnits(tokenAmount, 'ether'));
            await frxEth.transfer(user.getAddress(), ethers.utils.parseUnits(tokenAmount, 'ether'));
        }

        return {
            admin,
            alice,
            bob,
            carol,
            feeCollector,
            zunamiPool,
            zunamiPoolController,
            tokenConverter,
            rewardManager,
            zunamiPoolAps,
            zunamiPoolControllerAps,
            strategiesAps,
            genericOracle,
            wEth,
            frxEth,
        };
    }

    // Reset the network to the initial state
    after(async function () {
      await reset(PROVIDER_URL, FORK_BLOCK_NUMBER);
    });

    it('should deposit, withdraw and compound all rewards in all strategies', async () => {
        const {
            admin,
            zunamiPool,
            zunamiPoolController,
            zunamiPoolAps,
            zunamiPoolControllerAps,
            strategiesAps,
            tokenConverter,
        } = await loadFixture(deployFixture);

        await expect(
            zunamiPoolController
                .connect(admin)
                .deposit(getMinAmountZunETH('500'), admin.getAddress())
        ).to.emit(zunamiPool, 'Deposited');

        for (let i = 0; i < strategiesAps.length; i++) {
            const strategy = strategiesAps[i];
            await zunamiPoolAps.addStrategy(strategy.address);

            await zunamiPoolControllerAps.setDefaultDepositSid(i);

            const zStableBalance = parseUnits('100', 'ether');

            await zunamiPool.approve(zunamiPoolControllerAps.address, zStableBalance);

            await expect(
                zunamiPoolControllerAps
                    .connect(admin)
                    .deposit([zStableBalance, 0, 0, 0, 0], admin.getAddress())
            ).to.emit(zunamiPoolAps, 'Deposited');
        }

        await zunamiPoolControllerAps.setDefaultDepositSid(0);

        expect(await zunamiPoolControllerAps.collectedManagementFee()).to.eq(0);

        await zunamiPoolControllerAps.autoCompoundAll();

        await mintTokenTo(
            zunamiPoolControllerAps.address,
            admin,
            '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B', // CRV
            '0x28C6c06298d514Db089934071355E5743bf21d60', // CRV Vault
            parseUnits('100', 'ether')
        );

        await mintTokenTo(
            zunamiPoolControllerAps.address,
            admin,
            '0xD533a949740bb3306d119CC777fa900bA034cd52', // CVX
            '0xF977814e90dA44bFA03b6295A0616a897441aceC', // CVX Vault
            parseUnits('100', 'ether')
        );

        await mintTokenTo(
            zunamiPoolControllerAps.address,
            admin,
            '0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0', // fxs
            '0x6FCfEE4F14EaFA723D90ad4b282757C5FE3D92EE', // fxs Vault
            parseUnits('100', 'ether')
        );

        await mintTokenTo(
            zunamiPoolControllerAps.address,
            admin,
            '0x73968b9a57c6E53d41345FD57a6E6ae27d6CDB2F', // sdt
            '0xAced00E50cb81377495ea40A1A44005fe6d2482d', // sdt Vault
            parseUnits('100', 'ether')
        );

        await zunamiPool.transfer(zunamiPoolControllerAps.address, parseUnits('0.001', 'ether')); // zunUSD

        await zunamiPool.transfer(
          tokenConverter.address,
          ethers.utils.parseUnits('0.001', 'ether').sub(MINIMUM_LIQUIDITY)
        );

        await zunamiPoolControllerAps.autoCompoundAll();
        expect(await zunamiPoolControllerAps.collectedManagementFee()).to.not.eq(0);

        let collectedManagementFeeBefore = await zunamiPoolControllerAps.collectedManagementFee();
        await zunamiPool.transfer(zunamiPoolControllerAps.address, parseUnits('0.001', 'ether'));
        let balanceBefore = await zunamiPool.balanceOf(zunamiPoolControllerAps.address);
        await zunamiPoolControllerAps.autoCompoundAll();
        // expect(
        //   balanceBefore.sub(await zunamiPool.balanceOf(zunamiPoolControllerAps.address))
        // ).to.be.eq(parseUnits('8.5', 'ether'));
        // expect(
        //   (await zunamiPoolControllerAps.collectedManagementFee()).sub(
        //     collectedManagementFeeBefore
        //   )
        // ).to.be.eq(parseUnits('1.5', 'ether'));

        collectedManagementFeeBefore = await zunamiPoolControllerAps.collectedManagementFee();
        await zunamiPool.transfer(zunamiPoolControllerAps.address, parseUnits('0.002', 'ether'));
        balanceBefore = await zunamiPool.balanceOf(zunamiPoolControllerAps.address);
        await zunamiPoolControllerAps.autoCompoundAll();
        // expect(
        //   balanceBefore.sub(await zunamiPool.balanceOf(zunamiPoolControllerAps.address))
        // ).to.be.eq(parseUnits('17', 'ether'));
        // expect(
        //   (await zunamiPoolControllerAps.collectedManagementFee()).sub(
        //     collectedManagementFeeBefore
        //   )
        // ).to.be.eq(parseUnits('3', 'ether'));

        expect(await zunamiPool.balanceOf(zunamiPoolControllerAps.address)).to.eq(
          await zunamiPoolControllerAps.collectedManagementFee()
        );

        await zunamiPoolControllerAps.claimManagementFee();

        expect(await zunamiPoolControllerAps.collectedManagementFee()).to.eq(0);

        const sharesAmount = BigNumber.from(
            await zunamiPoolControllerAps.balanceOf(admin.getAddress())
        );
        expect(sharesAmount).to.gt(0);

        await time.increase(604800);

        const withdrawAmount = ethers.utils.parseUnits('99', 'ether').sub(MINIMUM_LIQUIDITY);
        for (let i = 0; i < strategiesAps.length; i++) {
            let assetsBefore = BigNumber.from(await zunamiPool.balanceOf(admin.getAddress()));

            await zunamiPoolControllerAps.setDefaultWithdrawSid(i);

            const sharesAmountBefore = BigNumber.from(
                await zunamiPoolControllerAps.balanceOf(admin.getAddress())
            );

            await expect(
                zunamiPoolControllerAps.withdraw(
                    withdrawAmount,
                    [0, 0, 0, 0, 0],
                    admin.getAddress()
                )
            ).to.emit(zunamiPoolAps, 'Withdrawn');

            const sharesAmountAfter = BigNumber.from(
                await zunamiPoolControllerAps.balanceOf(admin.getAddress())
            );
            expect(sharesAmountBefore).to.gt(sharesAmountAfter);

            expect(
                BigNumber.from(await zunamiPool.balanceOf(admin.getAddress())).sub(assetsBefore)
            ).to.gt(0);
        }
    });

    it('should inflate and deflate', async () => {
        const {
            admin,
            alice,
            zunamiPool,
            zunamiPoolController,
            zunamiPoolAps,
            zunamiPoolControllerAps,
            strategiesAps,
        } = await loadFixture(deployFixture);

        const withdrawSid = 4;
        await setPoolWithdrawSid(admin, zunamiPoolController, withdrawSid);

        await expect(
            zunamiPoolController
                .connect(admin)
                .deposit(getMinAmountZunETH('10'), admin.getAddress())
        ).to.emit(zunamiPool, 'Deposited');

        const sid = 0;
        const strategy = strategiesAps[1];
        await zunamiPoolAps.addStrategy(strategy.address);

        await zunamiPoolControllerAps.setDefaultDepositSid(sid);

        const zStableBalance = parseUnits('10', 'ether');

        await zunamiPool.approve(zunamiPoolControllerAps.address, zStableBalance);

        await expect(
            zunamiPoolControllerAps
                .connect(admin)
                .deposit([zStableBalance, 0, 0, 0, 0], admin.getAddress())
        ).to.emit(zunamiPoolAps, 'Deposited');

        await time.increase(604800);

        await expect(strategy.connect(alice).inflate(100, 100)).to.be.revertedWithCustomError(
            strategy,
            `AccessControlUnauthorizedAccount`
        );

        await time.increase(604800);

        await expect(strategy.connect(alice).deflate(100, 100)).to.be.revertedWithCustomError(
            strategy,
            `AccessControlUnauthorizedAccount`
        );

        await time.increase(604800);

        let holdingsBefore = await zunamiPoolAps.totalHoldings();
        await strategy.connect(admin).inflate(parseUnits('0.33333', 'ether'), 0);
        let holdingsAfterInflation = await zunamiPoolAps.totalHoldings();
        expect(holdingsAfterInflation).to.lt(holdingsBefore);

        await time.increase(604800);

        await strategy.connect(admin).deflate(parseUnits('0.6666666', 'ether'), 0);
        expect(await zunamiPoolAps.totalHoldings()).to.gt(holdingsAfterInflation);

        await time.increase(604800);

        holdingsBefore = await zunamiPoolAps.totalHoldings();
        await strategy.connect(admin).inflate(parseUnits('1', 'ether'), 0);
        holdingsAfterInflation = await zunamiPoolAps.totalHoldings();
        expect(holdingsAfterInflation).to.lt(holdingsBefore);

        await time.increase(604800);

        await strategy.connect(admin).deflate(parseUnits('1', 'ether'), 0);
        expect(await zunamiPoolAps.totalHoldings()).to.gt(holdingsAfterInflation);
    });

    it('should deposit to aps using zap 2', async () => {
        const {
            admin,
            zunamiPool,
            zunamiPoolAps,
            zunamiPoolControllerAps,
            tokenConverter,
            wEth,
            frxEth,
            strategiesAps,
        } = await loadFixture(deployFixture);

        // Add strategies to omnipool and aps pool
        const sid = 0;
        await zunamiPoolAps.addStrategy(strategiesAps[sid].address);

        //deploy zap
        const ZunamiDepositZapFactory = await ethers.getContractFactory('ZunamiDepositEthZap2');
        const zunamiDepositZap = (await ZunamiDepositZapFactory.deploy(
            zunamiPool.address,
            zunamiPoolControllerAps.address,
            tokenConverter.address
        )) as ZunamiDepositZap;

        expect(await zunamiPoolControllerAps.balanceOf(admin.getAddress())).to.eq(0);

        const tokenAmount = '10';
        await wEth
            .connect(admin)
            .approve(zunamiDepositZap.address, parseUnits(tokenAmount, 'ether'));
        await frxEth
            .connect(admin)
            .approve(zunamiDepositZap.address, parseUnits(tokenAmount, 'ether'));

        await zunamiDepositZap
            .connect(admin)
            .deposit(getMinAmountZunETH(tokenAmount), admin.getAddress(), {value:   parseUnits(tokenAmount, 'ether')});

        expect(await zunamiPoolControllerAps.balanceOf(admin.getAddress())).to.gt(0);
    });

  it('should deposit and withdraw using zap', async () => {
    const {
      admin,
      zunamiPool,
      zunamiPoolAps,
      zunamiPoolControllerAps,
      tokenConverter,
      wEth,
      frxEth,
      strategiesAps,
      genericOracle,
    } = await loadFixture(deployFixture);

    // Add strategies to omnipool and aps pool
    const sid = 0;
    await zunamiPoolAps.addStrategy(strategiesAps[sid].address);


    const StakingRewardDistributorFactory = await ethers.getContractFactory(
      'StakingRewardDistributor'
    );

    const instance = await upgrades.deployProxy(
      StakingRewardDistributorFactory,
      [zunamiPoolControllerAps.address, 'LP', 'LP', admin.address],
      {
        kind: 'uups',
      }
    );
    await instance.deployed();

    const stakingRewardDistributor = instance as StakingRewardDistributor;

    const zunAddress = '0x6b5204b0be36771253cc38e88012e02b752f0f36';
    //deploy zap
    const ZunamiDepositZapFactory = await ethers.getContractFactory('ZunamiEthZap');
    const zunamiDepositZap = (await ZunamiDepositZapFactory.deploy(
      zunamiPool.address,
      zunamiPoolControllerAps.address,
      stakingRewardDistributor.address,
      tokenConverter.address,
      genericOracle.address,
      zunAddress
    )) as ZunamiDepositZap;

    expect(await zunamiPoolControllerAps.balanceOf(admin.getAddress())).to.eq(0);

    const tokenAmount = '10';
    await wEth
      .connect(admin)
      .approve(zunamiDepositZap.address, parseUnits(tokenAmount, 'ether'));
    await frxEth
      .connect(admin)
      .approve(zunamiDepositZap.address, parseUnits(tokenAmount, 'ether'));

    await zunamiDepositZap
      .connect(admin)
      .deposit(getMinAmountZunETH(tokenAmount), admin.getAddress(), {value:   parseUnits(tokenAmount, 'ether')});

    expect(await stakingRewardDistributor.balanceOf(admin.getAddress())).to.closeTo(parseUnits("30", 'ether'), parseUnits("0.3", 'ether'));
  });

  it('should mint zunETH using stable zap 3', async () => {
    const {
      admin,
      bob,
      carol,
      zunamiPool,
      zunamiPoolController,
      wEth,
      frxEth,
      genericOracle,
    } = await loadFixture(deployFixture);

    await setPoolWithdrawSid(admin, zunamiPoolController, 0);

    const dailyMintDuration = 24 * 60 * 60; // 1 day in seconds
    const dailyMintLimit = ethers.utils.parseUnits('275', "ether"); // 1100000 / 4000
    const dailyRedeemDuration = 24 * 60 * 60; // 1 day in seconds;
    const dailyRedeemLimit = ethers.utils.parseUnits('25', "ether"); // 100000 / 4000

    //deploy zap
    const ZunamiStableZapFactory = await ethers.getContractFactory('ZunamiStableZap3');
    const zunamiStableZap = (await ZunamiStableZapFactory.deploy(
      zunamiPoolController.address,
      genericOracle.address,
      dailyMintDuration,
      dailyMintLimit,
      dailyRedeemDuration,
      dailyRedeemLimit,
      '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      5000,
      bob.address
    )) as ZunamiStableZap2;

    expect(await zunamiPool.balanceOf(admin.getAddress())).to.eq(0);

    const approveAmount = '300';
    await wEth
      .connect(admin)
      .approve(zunamiStableZap.address, parseUnits(approveAmount, 'ether'));
    await frxEth
      .connect(admin)
      .approve(zunamiStableZap.address, parseUnits(approveAmount, 'ether'));

    await expect(zunamiStableZap
      .connect(admin)
      .mint(getMinAmountZunETH('150'), admin.getAddress(), 0)
    ).to.be.revertedWithCustomError(
      zunamiStableZap,
      `DailyMintLimitOverflow`
    );

    const mintAmountStable = await zunamiStableZap.estimateMint(getMinAmountZunETH('100'));

    await expect(zunamiStableZap
      .connect(admin)
      .mint(getMinAmountZunETH('100'), admin.getAddress(), parseUnits("201", 'ether'))
    ).to.be.revertedWithCustomError(
      zunamiStableZap,
      `BrokenMinimumAmount`
    );

    await zunamiStableZap
      .connect(admin)
      .mint(getMinAmountZunETH("100"), admin.getAddress(), mintAmountStable);

    expect(await zunamiPool.balanceOf(admin.getAddress())).to.eq(parseUnits("200", 'ether'));
    expect(await wEth.balanceOf(zunamiStableZap.address)).to.eq(0);
    expect(await frxEth.balanceOf(zunamiStableZap.address)).to.eq(0);
    expect(await wEth.balanceOf(carol.getAddress())).to.eq(0);
    expect(await frxEth.balanceOf(carol.getAddress())).to.eq(0);

    await zunamiPool
      .connect(admin)
      .approve(zunamiStableZap.address, parseUnits("50", 'ether'));

    await expect(zunamiStableZap
      .connect(admin)
      .redeem(parseUnits("50", 'ether'),  admin.getAddress(), 0)
    ).to.be.revertedWithCustomError(
      zunamiStableZap,
      `DailyRedeemLimitOverflow`
    );

    await expect(zunamiStableZap
      .connect(admin)
      .redeem(parseUnits("25", 'ether'),  carol.getAddress(), parseUnits("25.1", 'ether'))
    ).to.be.revertedWithCustomError(
      zunamiStableZap,
      `BrokenMinimumAmount`
    );

    await zunamiStableZap
      .connect(admin)
      .redeem(parseUnits("25", 'ether'),  carol.getAddress(), parseUnits("24.85", 'ether')) // minus 0.005% fee

    expect(await zunamiPool.balanceOf(admin.getAddress())).to.eq(parseUnits("175", 'ether'));
    expect(await wEth.balanceOf(zunamiStableZap.address)).to.eq(0);
    expect(await frxEth.balanceOf(zunamiStableZap.address)).to.eq(0);
    expect(await zunamiPool.balanceOf(bob.getAddress())).to.eq(parseUnits("0.125", 'ether'));
    expect(await wEth.balanceOf(carol.getAddress())).to.eq(parseUnits("12.4375", 'ether'));
    expect(await frxEth.balanceOf(carol.getAddress())).to.eq(parseUnits("12.4375", 'ether'));

    await time.increase(dailyRedeemDuration);

    await zunamiStableZap
      .connect(admin)
      .mint(getMinAmountZunETH("100"), admin.getAddress(), 0);

    expect(await zunamiPool.balanceOf(admin.getAddress())).to.eq(parseUnits("375", 'ether'));
  });
});
