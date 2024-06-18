import {ethers, network, upgrades} from 'hardhat';
import {
    impersonateAccount,
    loadFixture,
    setBalance,
} from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber, Signer } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { expect } from 'chai';

import { abi as erc20ABI } from '../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';

import { mintStables } from '../utils/MintStables';
import { createConvertersAndRewardManagerContracts } from '../utils/CreateConvertersAndRewardManagerContracts';
import { attachTokens } from '../utils/AttachTokens';
import { createStrategies } from '../utils/CreateStrategies';
import { getMinAmountZunUSD } from '../utils/GetMinAmountZunUSD';

import {
  ZunamiPool,
  ZunamiPoolCompoundController,
  ZunamiDepositZap,
  GenericOracle,
  IStableConverter,
  IERC20, StakingRewardDistributor, ITokenConverter,
} from '../../typechain-types';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
const MINIMUM_LIQUIDITY = 1e3;
const CRV_zunUSD_crvUSD_LP_ADDRESS = '0x8C24b3213FD851db80245FCCc42c40B94Ac9a745';

import * as addrs from '../address.json';
import { attachPoolAndControllerZunUSD } from '../utils/AttachPoolAndControllerZunUSD';
import { setupTokenConverterStables } from '../utils/SetupTokenConverter';

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

    await zunamiPoolController.setRewardManager(rewardManager);

    await zunamiPoolController.setFeeTokenId(0);

    await zunamiPoolController.setRewardTokens([
        addrs.crypto.crv,
        addrs.crypto.cvx,
        addrs.crypto.fxs,
        addrs.crypto.sdt,
        addrs.stablecoins.zunUSD,
    ]);
    await zunamiPool.grantRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address);
    return { zunamiPool, zunamiPoolController };
}

async function mintTokenTo(
    receiverAddr: string,
    ethVault: Signer,
    tokenAddr: string,
    tokenVaultAddr: string,
    tokenAmount: BigNumber
) {
    const token = new ethers.Contract(tokenAddr, erc20ABI, ethVault);
    //fund vault with eth
    await ethVault.sendTransaction({
        to: tokenVaultAddr,
        value: ethers.utils.parseEther('1'),
    });
    await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [tokenVaultAddr],
    });
    const tokenVaultSigner: Signer = ethers.provider.getSigner(tokenVaultAddr);
    await token.connect(tokenVaultSigner).transfer(receiverAddr, tokenAmount);
    await network.provider.request({
        method: 'hardhat_stopImpersonatingAccount',
        params: [tokenVaultAddr],
    });
}

// async function setOracleFixedPrice(
//     genericOracle: GenericOracle,
//     admin: string,
//     token: string,
//     price: string
// ) {
//     const FixedOracleFactory = await ethers.getContractFactory('FixedOracle');
//     const fixedOracle = await FixedOracleFactory.deploy(token, price);
//
//     await setCustomOracle(genericOracle, admin, token, fixedOracle.address);
// }

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

describe('ZunUSD flow APS tests', () => {
    const strategyApsNames = ['ZunUSDApsVaultStrat', 'ZunUsdCrvUsdApsConvexCurveStrat'];

    async function deployFixture() {
        // Contracts are deployed using the first signer/account by default
        const [admin, alice, bob, feeCollector] = await ethers.getSigners();

        const { dai, usdt, usdc } = attachTokens(admin);

        await mintStables(admin, usdc);

        const { stableConverter, rewardManager } = await createConvertersAndRewardManagerContracts(
            'StableConverter',
            'SellingCurveRewardManager'
        );

        const genericOracleAddress = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
        const GenericOracleFactory = await ethers.getContractFactory('GenericOracle');
        const genericOracle = (await GenericOracleFactory.attach(
            genericOracleAddress
        )) as GenericOracle;

        const zunUSDPoolAddress = '0x8C0D76C9B18779665475F3E212D9Ca1Ed6A1A0e6';
        const zunUSDPoolControllerAddress = '0x618eee502CDF6b46A2199C21D1411f3F6065c940';

        const { zunamiPool, zunamiPoolController } = await attachPoolAndControllerZunUSD(
            zunUSDPoolAddress,
            zunUSDPoolControllerAddress
        );

        const zunamiAdminAddress = '0xe9b2B067eE106A6E518fB0552F3296d22b82b32B';

        const crvUsdAddress = '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E';

        const CrvUsdOracleFactory = await ethers.getContractFactory('CrvUsdOracle');
        const crvUsdOracle = await CrvUsdOracleFactory.deploy(genericOracleAddress);
        await crvUsdOracle.deployed();

        await setCustomOracle(
            genericOracle,
            zunamiAdminAddress,
            crvUsdAddress,
            crvUsdOracle.address
        );

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

        const ZunUsdOracleFactory = await ethers.getContractFactory('ZunUsdOracle');
        const zunUsdOracle = await ZunUsdOracleFactory.deploy(genericOracleAddress);
        await zunUsdOracle.deployed();

        await setCustomOracle(
            genericOracle,
            zunamiAdminAddress,
            zunUSDPoolAddress,
            zunUsdOracle.address
        );

        const CRVZUNUSDPoolAddress = '0x8c24b3213fd851db80245fccc42c40b94ac9a745';

        const StaticCurveLPOracleFactory = await ethers.getContractFactory('StaticCurveLPOracle');
        const staticCurveLPOracle = await StaticCurveLPOracleFactory.deploy(
            genericOracleAddress,
            [crvUsdAddress, zunUSDPoolAddress],
            [18, 18],
            CRVZUNUSDPoolAddress
        );
        await staticCurveLPOracle.deployed();

        await setCustomOracle(
            genericOracle,
            zunamiAdminAddress,
            CRVZUNUSDPoolAddress,
            staticCurveLPOracle.address
        );

        const { zunamiPool: zunamiPoolAps, zunamiPoolController: zunamiPoolControllerAps } =
            await createPoolAndCompoundController(zunamiPool.address, rewardManager.address);

        const strategiesAps = await createStrategies(
            strategyApsNames,
            genericOracle,
            zunamiPoolAps,
            stableConverter,
            undefined,
            [zunamiPool.address, ADDRESS_ZERO, ADDRESS_ZERO, ADDRESS_ZERO, ADDRESS_ZERO],
            [1, 0, 0, 0, 0]
        );

        const StableConverterFactory = await ethers.getContractFactory('StableConverter');
        const stableConverterAps = (await StableConverterFactory.deploy()) as IStableConverter;

        const tokenApprovedAmount = '10000';
        for (const user of [admin, alice, bob]) {
            await dai
                .connect(user)
                .approve(zunamiPoolController.address, parseUnits(tokenApprovedAmount, 'ether'));
            await usdc
                .connect(user)
                .approve(zunamiPoolController.address, parseUnits(tokenApprovedAmount, 'mwei'));
            await usdt
                .connect(user)
                .approve(zunamiPoolController.address, parseUnits(tokenApprovedAmount, 'mwei'));
        }

        const tokenAmount = '10000';
        for (const user of [alice, bob]) {
            await dai.transfer(user.getAddress(), ethers.utils.parseUnits(tokenAmount, 'ether'));
            await usdc.transfer(user.getAddress(), ethers.utils.parseUnits(tokenAmount, 'mwei'));
            await usdt.transfer(user.getAddress(), ethers.utils.parseUnits(tokenAmount, 'mwei'));
        }

        return {
            admin,
            alice,
            bob,
            feeCollector,
            zunamiPool,
            zunamiPoolController,
            stableConverter,
            rewardManager,
            zunamiPoolAps,
            zunamiPoolControllerAps,
            strategiesAps,
            stableConverterAps,
            genericOracle,
            dai,
            usdc,
            usdt,
        };
    }

    it('should deposit, withdraw and compound all rewards in all strategies', async () => {
        const {
            admin,
            zunamiPool,
            zunamiPoolController,
            zunamiPoolAps,
            zunamiPoolControllerAps,
            strategiesAps,
            stableConverterAps,
        } = await loadFixture(deployFixture);

        await expect(
            zunamiPoolController
                .connect(admin)
                .deposit(getMinAmountZunUSD('10000'), admin.getAddress())
        ).to.emit(zunamiPool, 'Deposited');

        for (let i = 0; i < strategiesAps.length; i++) {
            const strategy = strategiesAps[i];
            await zunamiPoolAps.addStrategy(strategy.address);

            await zunamiPoolControllerAps.setDefaultDepositSid(i);

            const zStableBalance = parseUnits('1000', 'ether');

            await zunamiPool.approve(zunamiPoolControllerAps.address, zStableBalance);

            await expect(
                zunamiPoolControllerAps
                    .connect(admin)
                    .deposit([zStableBalance, 0, 0, 0, 0], admin.getAddress())
            ).to.emit(zunamiPoolAps, 'Deposited');
        }

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

        await zunamiPool.transfer(zunamiPoolControllerAps.address, parseUnits('100', 'ether')); // zunUSD

        await zunamiPool.transfer(
            stableConverterAps.address,
            ethers.utils.parseUnits('10000', 'ether').sub(MINIMUM_LIQUIDITY)
        );

        await zunamiPoolControllerAps.autoCompoundAll();
        expect(await zunamiPoolControllerAps.collectedManagementFee()).to.not.eq(0);

        let collectedManagementFeeBefore = await zunamiPoolControllerAps.collectedManagementFee();
        await zunamiPool.transfer(zunamiPoolControllerAps.address, parseUnits('10', 'ether'));
        let balanceBefore = await zunamiPool.balanceOf(zunamiPoolControllerAps.address);
        await zunamiPoolControllerAps.autoCompoundAll();
        // expect(
        //     balanceBefore.sub(await zunamiPool.balanceOf(zunamiPoolControllerAps.address))
        // ).to.be.eq(parseUnits('8.5', 'ether'));
        // expect(
        //     (await zunamiPoolControllerAps.collectedManagementFee()).sub(
        //         collectedManagementFeeBefore
        //     )
        // ).to.be.eq(parseUnits('1.5', 'ether'));

        collectedManagementFeeBefore = await zunamiPoolControllerAps.collectedManagementFee();
        await zunamiPool.transfer(zunamiPoolControllerAps.address, parseUnits('200', 'ether'));
        balanceBefore = await zunamiPool.balanceOf(zunamiPoolControllerAps.address);
        await zunamiPoolControllerAps.autoCompoundAll();
        // expect(
        //     balanceBefore.sub(await zunamiPool.balanceOf(zunamiPoolControllerAps.address))
        // ).to.be.eq(parseUnits('170', 'ether'));
        // expect(
        //     (await zunamiPoolControllerAps.collectedManagementFee()).sub(
        //         collectedManagementFeeBefore
        //     )
        // ).to.be.eq(parseUnits('30', 'ether'));

        expect(await zunamiPool.balanceOf(zunamiPoolControllerAps.address)).to.eq(
            await zunamiPoolControllerAps.collectedManagementFee()
        );

        await zunamiPoolControllerAps.claimManagementFee();

        expect(await zunamiPoolControllerAps.collectedManagementFee()).to.eq(0);

        const sharesAmount = BigNumber.from(
            await zunamiPoolControllerAps.balanceOf(admin.getAddress())
        );
        expect(sharesAmount).to.gt(0);

        const withdrawAmount = ethers.utils.parseUnits('500', 'ether').sub(MINIMUM_LIQUIDITY);

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
        const CRVZUNUSD = await ethers.getContractAt('ERC20Token', CRV_zunUSD_crvUSD_LP_ADDRESS);

        const {
            admin,
            alice,
            zunamiPool,
            zunamiPoolController,
            zunamiPoolAps,
            zunamiPoolControllerAps,
            strategiesAps,
        } = await loadFixture(deployFixture);

        await expect(
            zunamiPoolController
                .connect(admin)
                .deposit(getMinAmountZunUSD('10000'), admin.getAddress())
        ).to.emit(zunamiPool, 'Deposited');

        const sid = 0; // ZunUsdCrvUsdApsConvexCurveStrat
        const strategy = strategiesAps[1];
        await zunamiPoolAps.addStrategy(strategy.address);

        await zunamiPoolControllerAps.setDefaultDepositSid(sid);

        const zStableBalance = parseUnits('1000', 'ether');

        await zunamiPool.approve(zunamiPoolControllerAps.address, zStableBalance);

        await expect(
            zunamiPoolControllerAps
                .connect(admin)
                .deposit([zStableBalance, 0, 0, 0, 0], admin.getAddress())
        ).to.emit(zunamiPoolAps, 'Deposited');

        await expect(strategy.connect(alice).inflate(100, 100)).to.be.revertedWithCustomError(
            strategy,
            `AccessControlUnauthorizedAccount`
        );
        await expect(strategy.connect(alice).deflate(100, 100)).to.be.revertedWithCustomError(
            strategy,
            `AccessControlUnauthorizedAccount`
        );

        let holdingsBefore = await zunamiPoolAps.totalHoldings();
        await strategy.connect(admin).inflate(parseUnits('0.33333', 'ether'), 0);
        let holdingsAfterInflation = await zunamiPoolAps.totalHoldings();
        expect(holdingsAfterInflation).to.lt(holdingsBefore);

        await strategy.connect(admin).deflate(parseUnits('0.6666666', 'ether'), 0);
        expect(await zunamiPoolAps.totalHoldings()).to.gt(holdingsAfterInflation);

        holdingsBefore = await zunamiPoolAps.totalHoldings();
        await strategy.connect(admin).inflate(parseUnits('1', 'ether'), 0);
        holdingsAfterInflation = await zunamiPoolAps.totalHoldings();
        expect(holdingsAfterInflation).to.lt(holdingsBefore);

        await strategy.connect(admin).deflate(parseUnits('1', 'ether'), 0);
        expect(await zunamiPoolAps.totalHoldings()).to.gt(holdingsAfterInflation);
    });

    it('should deposit to aps using zap', async () => {
        const {
            admin,
            zunamiPool,
            zunamiPoolAps,
            zunamiPoolControllerAps,
            dai,
            usdc,
            usdt,
            strategiesAps,
        } = await loadFixture(deployFixture);

        // Add strategies to omnipool and aps pool
        const sid = 0;
        await zunamiPoolAps.addStrategy(strategiesAps[sid].address);

        const curveRouterAddr = '0xF0d4c12A5768D806021F80a262B4d39d26C58b8D';
        const TokenConverterFactory = await ethers.getContractFactory('TokenConverter');
        const tokenConverter = (await TokenConverterFactory.deploy(
          curveRouterAddr
        )) as ITokenConverter;

        await setupTokenConverterStables(tokenConverter);

        //deploy zap
        const ZunamiDepositZapFactory = await ethers.getContractFactory('ZunamiDepositZap2');
        const zunamiDepositZap = (await ZunamiDepositZapFactory.deploy(
            zunamiPool.address,
            zunamiPoolControllerAps.address,
            tokenConverter.address
        )) as ZunamiDepositZap;

        expect(await zunamiPoolControllerAps.balanceOf(admin.getAddress())).to.eq(0);

        const tokenAmount = '10000';
        await dai
            .connect(admin)
            .approve(zunamiDepositZap.address, parseUnits(tokenAmount, 'ether'));
        await usdc
            .connect(admin)
            .approve(zunamiDepositZap.address, parseUnits(tokenAmount, 'mwei'));
        await usdt
            .connect(admin)
            .approve(zunamiDepositZap.address, parseUnits(tokenAmount, 'mwei'));

        await zunamiDepositZap
            .connect(admin)
            .deposit(getMinAmountZunUSD(tokenAmount), admin.getAddress());

        expect(await zunamiPoolControllerAps.balanceOf(admin.getAddress())).to.gt(0);
    });

  it('should deposit to aps using zap 3', async () => {
    const {
      admin,
      zunamiPool,
      zunamiPoolAps,
      zunamiPoolControllerAps,
      dai,
      usdc,
      usdt,
      strategiesAps,
    } = await loadFixture(deployFixture);

    // Add strategies to omnipool and aps pool
    const sid = 0;
    await zunamiPoolAps.addStrategy(strategiesAps[sid].address);

    const curveRouterAddr = '0xF0d4c12A5768D806021F80a262B4d39d26C58b8D';
    const TokenConverterFactory = await ethers.getContractFactory('TokenConverter');
    const tokenConverter = (await TokenConverterFactory.deploy(
      curveRouterAddr
    )) as ITokenConverter;

    await setupTokenConverterStables(tokenConverter);

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

    //deploy zap
    const ZunamiDepositZapFactory = await ethers.getContractFactory('ZunamiDepositZap3');
    const zunamiDepositZap = (await ZunamiDepositZapFactory.deploy(
      zunamiPool.address,
      zunamiPoolControllerAps.address,
      stakingRewardDistributor.address,
      tokenConverter.address
    )) as ZunamiDepositZap;

    expect(await zunamiPoolControllerAps.balanceOf(admin.getAddress())).to.eq(0);

    const tokenAmount = '10000';
    await dai
      .connect(admin)
      .approve(zunamiDepositZap.address, parseUnits(tokenAmount, 'ether'));
    await usdc
      .connect(admin)
      .approve(zunamiDepositZap.address, parseUnits(tokenAmount, 'mwei'));
    await usdt
      .connect(admin)
      .approve(zunamiDepositZap.address, parseUnits(tokenAmount, 'mwei'));

    await zunamiDepositZap
      .connect(admin)
      .deposit(getMinAmountZunUSD(tokenAmount), admin.getAddress());

    expect(await zunamiPoolControllerAps.balanceOf(admin.getAddress())).to.closeTo(0, 1);
  });
});
