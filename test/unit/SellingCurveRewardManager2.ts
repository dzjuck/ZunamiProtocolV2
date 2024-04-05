import { ethers, network } from 'hardhat';
import BigNumber from 'bignumber.js';
import { expect } from 'chai';
import chai from 'chai';
import { Contract } from '@ethersproject/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { FakeContract, smock } from '@defi-wonderland/smock';
import {
    setupTokenConverterStables,
    setupTokenConverterETHs,
    setupTokenConverterRewards,
} from '../utils/SetupTokenConverter.js';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
import { GenericOracle } from '../../typechain-types';
import * as addresses from '../address.json';
import { Address } from 'hardhat-deploy/dist/types';

chai.should(); // if you like should syntax
chai.use(smock.matchers);

export const tokenify = (value: any) => ethers.utils.parseUnits(value, 18);
export const stablify = (value: any) => ethers.utils.parseUnits(value, 6);

async function sendTokens(
    impersonate: Address,
    to: Address,
    tokenAddr: Address,
    amount: any,
    admin: SignerWithAddress
) {
    await network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [impersonate],
    });
    const whale = await ethers.getSigner(impersonate);

    await admin.sendTransaction({
        to: whale.address,
        value: ethers.utils.parseEther('1.0'),
    });

    const TokenFactory = await ethers.getContractFactory('ERC20Token', admin);
    const token = TokenFactory.attach(tokenAddr);
    await token.connect(whale).transfer(to, amount);
}

describe('SellingCurveRewardManager2 tests', () => {
    let admin: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;

    let tokenConverter: Contract;
    let sellingCurveRewardManager: Contract;

    before(async () => {
        [admin, alice, bob] = await ethers.getSigners();

        const TokenConverterFactory = await ethers.getContractFactory('TokenConverter', admin);
        tokenConverter = await TokenConverterFactory.deploy(
            '0xF0d4c12A5768D806021F80a262B4d39d26C58b8D'
        );

        await setupTokenConverterRewards(tokenConverter);
        const genericOracleAddress = '0x4142bB1ceeC0Dec4F7aaEB3D51D2Dc8E6Ee18410';
        const GenericOracleFactory = await ethers.getContractFactory('GenericOracle');
        const genericOracle = (await GenericOracleFactory.attach(
            genericOracleAddress
        )) as GenericOracle;

        const ZunOracleFactory = await ethers.getContractFactory('ZunEthOracle');
        const zunOracle = await ZunOracleFactory.deploy(genericOracle.address);

        const SdtOracleFactory = await ethers.getContractFactory('SdtOracle');
        const sdtOracle = await SdtOracleFactory.deploy(genericOracle.address);

        const impersonateAddr = '0xe9b2B067eE106A6E518fB0552F3296d22b82b32B';
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [impersonateAddr],
        });
        const impersonate = await ethers.getSigner(impersonateAddr);
        await admin.sendTransaction({
            to: impersonate.address,
            value: ethers.utils.parseEther('10.0'),
        });

        await genericOracle
            .connect(impersonate)
            .setCustomOracle(addresses.crypto.zunETH, zunOracle.address);

        await genericOracle
            .connect(impersonate)
            .setCustomOracle(addresses.crypto.sdt, sdtOracle.address);

        const SellingCurveRewardManagerFactory = await ethers.getContractFactory(
            'SellingCurveRewardManager2',
            admin
        );

        sellingCurveRewardManager = await SellingCurveRewardManagerFactory.deploy(
            tokenConverter.address,
            genericOracle.address
        );
    });

    describe('CRV', () => {
        it('should swap CRV to zunETH', async () => {
            const tokenInAddr = addresses.crypto.crv;
            const tokenOutAddr = addresses.crypto.zunETH;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = tokenify('100');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(sellingCurveRewardManager.address, amount);
            await sellingCurveRewardManager
                .connect(alice)
                .handle(tokenInAddr, amount, tokenOutAddr);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap CRV to zunUSD', async () => {
            const tokenInAddr = addresses.crypto.crv;
            const tokenOutAddr = addresses.stablecoins.zunUSD;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = tokenify('100');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(sellingCurveRewardManager.address, amount);
            await sellingCurveRewardManager
                .connect(alice)
                .handle(tokenInAddr, amount, tokenOutAddr);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });

    describe('CVX', () => {
        it('should swap CVX to zunETH', async () => {
            const tokenInAddr = addresses.crypto.cvx;
            const tokenOutAddr = addresses.crypto.zunETH;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = tokenify('100');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(sellingCurveRewardManager.address, amount);
            await sellingCurveRewardManager
                .connect(alice)
                .handle(tokenInAddr, amount, tokenOutAddr);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap CVX to zunUSD', async () => {
            const tokenInAddr = addresses.crypto.cvx;
            const tokenOutAddr = addresses.stablecoins.zunUSD;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = tokenify('100');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(sellingCurveRewardManager.address, amount);
            await sellingCurveRewardManager
                .connect(alice)
                .handle(tokenInAddr, amount, tokenOutAddr);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });

    describe('SDT', () => {
        it('should swap SDT to zunETH', async () => {
            const tokenInAddr = addresses.crypto.sdt;
            const tokenOutAddr = addresses.crypto.zunETH;
            const impersonate = '0xAced00E50cb81377495ea40A1A44005fe6d2482d';
            const amount = tokenify('100');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(sellingCurveRewardManager.address, amount);
            await sellingCurveRewardManager
                .connect(alice)
                .handle(tokenInAddr, amount, tokenOutAddr);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap SDT to zunUSD', async () => {
            const tokenInAddr = addresses.crypto.sdt;
            const tokenOutAddr = addresses.stablecoins.zunUSD;
            const impersonate = '0xAced00E50cb81377495ea40A1A44005fe6d2482d';
            const amount = tokenify('100');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(sellingCurveRewardManager.address, amount);
            await sellingCurveRewardManager
                .connect(alice)
                .handle(tokenInAddr, amount, tokenOutAddr);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });

    describe('FXS', () => {
        it('should swap FXS to zunETH', async () => {
            const tokenInAddr = addresses.crypto.fxs;
            const tokenOutAddr = addresses.crypto.zunETH;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = tokenify('100');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(sellingCurveRewardManager.address, amount);

            await sellingCurveRewardManager
                .connect(alice)
                .handle(tokenInAddr, amount, tokenOutAddr);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap FXS to zunUSD', async () => {
            const tokenInAddr = addresses.crypto.fxs;
            const tokenOutAddr = addresses.stablecoins.zunUSD;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = tokenify('100');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(sellingCurveRewardManager.address, amount);

            await sellingCurveRewardManager
                .connect(alice)
                .handle(tokenInAddr, amount, tokenOutAddr);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });
});
