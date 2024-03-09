import { ethers, network } from 'hardhat';
import {impersonateAccount, loadFixture, setBalance} from '@nomicfoundation/hardhat-network-helpers';
import {BigNumber, Signer} from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { expect } from 'chai';

import { abi as erc20ABI } from '../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';

import { mintStables } from '../utils/MintStables';
import { createConvertersAndRewardManagerContracts } from '../utils/CreateConvertersAndRewardManagerContracts';
import { createStablecoins } from '../utils/CreateStablecoins';
import { createStrategies } from '../utils/CreateStrategies';
import { getMinAmountZunUSD } from '../utils/GetMinAmountZunUSD';

import {
  ZunamiPool,
  ZunamiPoolCompoundController,
  ZunamiDepositZap,
  GenericOracle,
  IStableConverter, IERC20
} from '../../typechain-types';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
const MINIMUM_LIQUIDITY = 1e3;

import * as addrs from '../address.json';
import {attachPoolAndControllerZunUSD} from "../utils/AttachPoolAndControllerZunUSD";

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

async function initCurveRegistryCache() {
  const curvePools = ['0x8c24b3213fd851db80245fccc42c40b94ac9a745'];

  const curveRegistryCacheAddress = '0x2E68bE71687469280319BCf9E635a8783Db5d238';

  const curveRegistryCache = await ethers.getContractAt(
    'CurveRegistryCache',
    curveRegistryCacheAddress
  );

  for (const curvePool of curvePools) {
    await curveRegistryCache.initPool(curvePool);
  }
}

async function setOracleFixedPrice(genericOracle: GenericOracle, admin: string, token: string, price: string) {
  const FixedOracleFactory = await ethers.getContractFactory("FixedOracle");
  const fixedOracle = await FixedOracleFactory.deploy(token, price);

  await impersonateAccount(admin);
  const impersonatedSigner = await ethers.getSigner(admin);

  // set balance to cover any tx costs
  await setBalance(admin, ethers.utils.parseEther('2').toHexString());

  await genericOracle.connect(impersonatedSigner).setCustomOracle(token, fixedOracle.address);
}

describe('ZunUSD flow APS tests', () => {
    const strategyApsNames = ['ZunUSDApsVaultStrat','ZunUsdCrvUsdApsConvexCurveStrat'];

    async function deployFixture() {
        // Contracts are deployed using the first signer/account by default
        const [admin, alice, bob, feeCollector] = await ethers.getSigners();

        const { dai, usdt, usdc } = createStablecoins(admin);

        await mintStables(admin, usdc);

        const { stableConverter, rewardManager } = await createConvertersAndRewardManagerContracts(
            'StableConverter',
            'SellingCurveRewardManager'
        );

        const genericOracleAddress = "0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410";
        const GenericOracleFactory = await ethers.getContractFactory('GenericOracle');
        const genericOracle = (await GenericOracleFactory.attach(genericOracleAddress)) as GenericOracle;

        const zunamiDeploerAddress = "0xe9b2B067eE106A6E518fB0552F3296d22b82b32B";
        const CRVZUNUSDPoolAddress = "0x8c24b3213fd851db80245fccc42c40b94ac9a745";
        await setOracleFixedPrice(genericOracle, zunamiDeploerAddress, CRVZUNUSDPoolAddress, 1e18.toString());

        const zunUSDPoolAddress = "0x8C0D76C9B18779665475F3E212D9Ca1Ed6A1A0e6";
        const zunUSDPoolControllerAddress = "0x618eee502CDF6b46A2199C21D1411f3F6065c940";

        const { zunamiPool, zunamiPoolController } =
            await attachPoolAndControllerZunUSD(zunUSDPoolAddress, zunUSDPoolControllerAddress);

        const { stableConverter: stableConverterAps, rewardManager: rewardManagerAps } =
            await createConvertersAndRewardManagerContracts(
                'StubStableConverter',
                'SellingCurveRewardManager'
            );

        const { zunamiPool: zunamiPoolAps, zunamiPoolController: zunamiPoolControllerAps } =
            await createPoolAndCompoundController(zunamiPool.address, rewardManagerAps.address);

        const strategiesAps = await createStrategies(
            strategyApsNames,
            genericOracle,
            zunamiPoolAps,
            stableConverter,
          undefined,
            [zunamiPool.address, ADDRESS_ZERO, ADDRESS_ZERO, ADDRESS_ZERO, ADDRESS_ZERO],
            [1, 0, 0, 0, 0]
        );

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
            rewardManagerAps,
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

        expect(await zunamiPoolControllerAps.collectedManagementFee()).to.eq(0);

        // "0xD533a949740bb3306d119CC777fa900bA034cd52", // CRV
        // "0xF977814e90dA44bFA03b6295A0616a897441aceC", // CRV Vault
        await mintTokenTo(
            zunamiPoolControllerAps.address, // zEthFrxEthCurveConvex
            admin,
            '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B', // CVX
            '0x28C6c06298d514Db089934071355E5743bf21d60', // CVX Vault
            parseUnits('100', 'ether')
        );

        await zunamiPool.transfer(
            stableConverterAps.address,
            ethers.utils.parseUnits('10000', 'ether').sub(MINIMUM_LIQUIDITY)
        );

        await zunamiPoolControllerAps.autoCompoundAll();

        expect(await zunamiPoolControllerAps.collectedManagementFee()).to.not.eq(0);

        expect(await zunamiPool.balanceOf(zunamiPoolControllerAps.address)).to.eq(
            await zunamiPoolControllerAps.collectedManagementFee()
        );

        await zunamiPoolControllerAps.claimManagementFee();

        expect(await zunamiPoolControllerAps.collectedManagementFee()).to.eq(0);

        const sharesAmount = BigNumber.from(
          await zunamiPoolControllerAps.balanceOf(admin.getAddress())
        );
        expect(sharesAmount).to.gt(0);

        const withdrawAmount =  ethers.utils.parseUnits('500', 'ether').sub(MINIMUM_LIQUIDITY);

        for (let i = 0; i < strategiesAps.length; i++) {
            let assetsBefore = BigNumber.from(await zunamiPool.balanceOf(admin.getAddress()));

            await zunamiPoolControllerAps.setDefaultWithdrawSid(i);

            const sharesAmountBefore = BigNumber.from(
              await zunamiPoolControllerAps.balanceOf(admin.getAddress())
            );

            await expect(
                zunamiPoolControllerAps.withdraw(withdrawAmount, [0, 0, 0, 0, 0], admin.getAddress())
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

    it('should deposit to aps using zap', async () => {
        const {
            admin,
            zunamiPoolController,
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

        //deploy zap
        const ZunamiDepositZapFactory = await ethers.getContractFactory('ZunamiDepositZap');
        const zunamiDepositZap = (await ZunamiDepositZapFactory.deploy(
            zunamiPoolController.address,
            zunamiPoolControllerAps.address
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
});
