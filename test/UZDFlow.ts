import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { BigNumber } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { expect } from 'chai';

import { abi as erc20ABI } from '../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';

import { increaseChainTime } from './utils/IncreaseChainTime';
import { mintStables } from './utils/MintStables';
import { createAndInitConicOracles } from './utils/CreateAndInitConicOracles';
import { createConverterAndRewardManagerContracts } from './utils/CreateConverterAndRewardManagerContracts';
import { createStablecoins } from './utils/CreateStablecoins';
import { createStrategies } from './utils/CreateStrategies';
import { createPoolAndControllerUZD } from './utils/CreatePoolAndControllerUZD';
import { getMinAmountUZD } from './utils/GetMinAmountUZD';

const crvUSD_USDT_pool_addr = '0x390f3595bca2df7d23783dfd126427cceb997bf4';
const crvUSD_USDC_pool_addr = '0x4dece678ceceb27446b35c672dc7d61f30bad69e';

describe('UZD flow tests', () => {
    const strategyNames = ['UsdcCrvUsdStakeDaoCurve', 'UsdtCrvUsdStakeDaoCurve', 'VaultStrat'];

    async function deployFixture() {
        // Contracts are deployed using the first signer/account by default
        const [admin, alice, bob, feeCollector] = await ethers.getSigners();

        const { dai, usdt, usdc } = createStablecoins(admin);

        await mintStables(admin, usdc);

        const { curveRegistryCache, chainlinkOracle, genericOracle, curveLPOracle } =
            await createAndInitConicOracles([crvUSD_USDT_pool_addr, crvUSD_USDC_pool_addr]);

        const { zunamiPool, zunamiPoolController } = await createPoolAndControllerUZD();

        const { stableConverter, rewardManager } = await createConverterAndRewardManagerContracts(
            'StableConverter',
            'SellingCurveRewardManager'
        );

        const strategies = await createStrategies(
            strategyNames,
            genericOracle,
            zunamiPool,
            stableConverter
        );

        const tokenApprovedAmount = '1000000';

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
            strategies,
            stableConverter,
            rewardManager,
            curveRegistryCache,
            curveLPOracle,
            chainlinkOracle,
            genericOracle,
            dai,
            usdc,
            usdt,
        };
    }

    it('should deposit assets', async () => {
        const { admin, alice, bob, zunamiPool, zunamiPoolController, strategies, dai, usdc, usdt } =
            await loadFixture(deployFixture);

        for (let poolId = 0; poolId < strategies.length; poolId++) {
            await zunamiPool.addStrategy(strategies[poolId].address);
            await zunamiPoolController.setDefaultDepositSid(poolId);
            await zunamiPoolController.setDefaultWithdrawSid(poolId);

            for (const user of [admin, alice, bob]) {
                const daiBefore = await dai.balanceOf(user.getAddress());
                const usdcBefore = await usdc.balanceOf(user.getAddress());
                const usdtBefore = await usdt.balanceOf(user.getAddress());
                const zStableBefore = await zunamiPool.balanceOf(user.getAddress());

                await expect(
                    zunamiPoolController
                        .connect(user)
                        .deposit(getMinAmountUZD('1000'), await user.getAddress())
                ).to.emit(zunamiPool, 'Deposited');

                expect(await dai.balanceOf(user.getAddress())).to.lt(daiBefore);
                expect(await usdc.balanceOf(user.getAddress())).to.lt(usdcBefore);
                expect(await usdt.balanceOf(user.getAddress())).to.lt(usdtBefore);
                expect(await zunamiPool.balanceOf(user.getAddress())).to.gt(zStableBefore);
            }
        }
    });

    it('should withdraw assets', async () => {
        const { alice, bob, zunamiPool, zunamiPoolController, strategies } = await loadFixture(
            deployFixture
        );

        for (let poolId = 0; poolId < strategies.length; poolId++) {
            await zunamiPool.addStrategy(strategies[poolId].address);
            await zunamiPoolController.setDefaultDepositSid(poolId);
            await zunamiPoolController.setDefaultWithdrawSid(poolId);

            for (const user of [alice, bob]) {
                await expect(
                    zunamiPoolController
                        .connect(user)
                        .deposit(getMinAmountUZD('1000'), user.getAddress())
                ).to.emit(zunamiPool, 'Deposited');

                let stableAmount = BigNumber.from(await zunamiPool.balanceOf(user.getAddress()));
                expect(stableAmount).to.gt(0);

                await zunamiPool.connect(user).approve(zunamiPoolController.address, stableAmount);

                await expect(
                    zunamiPoolController
                        .connect(user)
                        .withdraw(stableAmount, [0, 0, 0, 0, 0], user.getAddress())
                ).to.emit(zunamiPool, 'Withdrawn');
                stableAmount = BigNumber.from(await zunamiPool.balanceOf(user.getAddress()));
                expect(stableAmount).to.eq(0);
            }
        }
    });

    it('should claim and withdraw all rewards', async () => {
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
                    .deposit(getMinAmountUZD('1000'), admin.getAddress())
            ).to.emit(zunamiPool, 'Deposited');
        }

        await increaseChainTime(3600 * 24 * 7);

        await zunamiPoolController.claimRewards();

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

    it('should moveFunds only to not outdated pool', async () => {
        const { admin, alice, zunamiPool, zunamiPoolController, strategies } = await loadFixture(
            deployFixture
        );

        const poolSrc = 0;
        const poolDst = 1;
        const percentage = ethers.utils.parseUnits('1', 'ether'); // 1e18

        for (let poolId = 0; poolId < 2; poolId++) {
            await zunamiPool.addStrategy(strategies[poolId].address);
        }

        await zunamiPoolController.setDefaultDepositSid(poolSrc);
        await zunamiPoolController.setDefaultWithdrawSid(poolSrc);

        await expect((await zunamiPool.strategyInfo(poolSrc)).minted).to.be.eq(0);
        await expect(
            zunamiPoolController.connect(alice).deposit(getMinAmountUZD('1000'), admin.getAddress())
        ).to.emit(zunamiPool, 'Deposited');
        await expect((await zunamiPool.strategyInfo(poolSrc)).minted).to.be.gt(0);

        console.log(
            '(await zunamiPool.strategyInfo(poolSrc)).minted',
            (await zunamiPool.strategyInfo(poolSrc)).minted
        );
        console.log(
            '(await zunamiPool.strategyInfo(poolDst)).minted',
            (await zunamiPool.strategyInfo(poolDst)).minted
        );
        await expect((await zunamiPool.strategyInfo(poolSrc)).minted).to.be.gt(0);
        await expect((await zunamiPool.strategyInfo(poolDst)).minted).to.be.eq(0);
        await expect(zunamiPool.moveFundsBatch([poolSrc], [percentage], poolDst));
        await expect((await zunamiPool.strategyInfo(poolSrc)).minted).to.be.eq(0);
        await expect((await zunamiPool.strategyInfo(poolDst)).minted).to.be.gt(0);

        console.log(
            '(await zunamiPool.strategyInfo(poolSrc)).minted',
            (await zunamiPool.strategyInfo(poolSrc)).minted
        );
        console.log(
            '(await zunamiPool.strategyInfo(poolDst)).minted',
            (await zunamiPool.strategyInfo(poolDst)).minted
        );

        await expect(zunamiPool.moveFundsBatch([poolDst], [percentage], poolSrc));
        await expect((await zunamiPool.strategyInfo(poolSrc)).minted).to.be.gt(0);
        await expect((await zunamiPool.strategyInfo(poolDst)).minted).to.be.eq(0);

        console.log(
            '(await zunamiPool.strategyInfo(poolSrc)).minted',
            (await zunamiPool.strategyInfo(poolSrc)).minted
        );
        console.log(
            '(await zunamiPool.strategyInfo(poolDst)).minted',
            (await zunamiPool.strategyInfo(poolDst)).minted
        );
    });
});
