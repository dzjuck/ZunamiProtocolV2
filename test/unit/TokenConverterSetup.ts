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

describe('Token Converter', () => {
    let admin: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;

    let tokenConverter: Contract;

    beforeEach(async () => {
        [admin, alice, bob] = await ethers.getSigners();

        const TokenConverterFactory = await ethers.getContractFactory('TokenConverter', admin);

        tokenConverter = await TokenConverterFactory.deploy(
            '0xF0d4c12A5768D806021F80a262B4d39d26C58b8D'
        );
        await setupTokenConverterStables(tokenConverter);
        await setupTokenConverterETHs(tokenConverter);
        await setupTokenConverterRewards(tokenConverter);
    });

    describe('USDT', () => {
        it('should swap USDT to USDC', async () => {
            const tokenInAddr = addresses.stablecoins.usdt;
            const tokenOutAddr = addresses.stablecoins.usdc;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = stablify('100');
            const minAmountOut = stablify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap USDT to DAI', async () => {
            const tokenInAddr = addresses.stablecoins.usdt;
            const tokenOutAddr = addresses.stablecoins.dai;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = stablify('100');
            const minAmountOut = stablify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter.connect(alice).handle(tokenInAddr, tokenOutAddr, amount, 0);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap USDT to crvUSD', async () => {
            const tokenInAddr = addresses.stablecoins.usdt;
            const tokenOutAddr = addresses.stablecoins.crvUSD;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = stablify('100');
            const minAmountOut = stablify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter.connect(alice).handle(tokenInAddr, tokenOutAddr, amount, 0);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap USDT to zunUSD', async () => {
            const tokenInAddr = addresses.stablecoins.usdt;
            const tokenOutAddr = addresses.stablecoins.zunUSD;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = stablify('100');
            const minAmountOut = stablify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter.connect(alice).handle(tokenInAddr, tokenOutAddr, amount, 0);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });

    describe('USDC', () => {
        it('should swap USDC to USDT', async () => {
            const tokenInAddr = addresses.stablecoins.usdc;
            const tokenOutAddr = addresses.stablecoins.usdt;
            const impersonate = '0x28C6c06298d514Db089934071355E5743bf21d60';
            const amount = stablify('100');
            const minAmountOut = stablify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap USDC to DAI', async () => {
            const tokenInAddr = addresses.stablecoins.usdc;
            const tokenOutAddr = addresses.stablecoins.dai;
            const impersonate = '0x28C6c06298d514Db089934071355E5743bf21d60';
            const amount = stablify('100');
            const minAmountOut = tokenify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap USDC to crvUSD', async () => {
            const tokenInAddr = addresses.stablecoins.usdc;
            const tokenOutAddr = addresses.stablecoins.crvUSD;
            const impersonate = '0x28C6c06298d514Db089934071355E5743bf21d60';
            const amount = stablify('100');
            const minAmountOut = tokenify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap USDC to zunUSD', async () => {
            const tokenInAddr = addresses.stablecoins.usdc;
            const tokenOutAddr = addresses.stablecoins.zunUSD;
            const impersonate = '0x28C6c06298d514Db089934071355E5743bf21d60';
            const amount = stablify('100');
            const minAmountOut = tokenify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });

    describe('DAI', () => {
        it('should swap DAI to USDT', async () => {
            const tokenInAddr = addresses.stablecoins.dai;
            const tokenOutAddr = addresses.stablecoins.usdt;
            const impersonate = '0xBF293D5138a2a1BA407B43672643434C43827179';
            const amount = tokenify('100');
            const minAmountOut = stablify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap DAI to USDC', async () => {
            const tokenInAddr = addresses.stablecoins.dai;
            const tokenOutAddr = addresses.stablecoins.usdc;
            const impersonate = '0xBF293D5138a2a1BA407B43672643434C43827179';
            const amount = tokenify('100');
            const minAmountOut = stablify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap DAI to crvUSD', async () => {
            const tokenInAddr = addresses.stablecoins.dai;
            const tokenOutAddr = addresses.stablecoins.crvUSD;
            const impersonate = '0xBF293D5138a2a1BA407B43672643434C43827179';
            const amount = tokenify('100');
            const minAmountOut = tokenify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap DAI to zunUSD', async () => {
            const tokenInAddr = addresses.stablecoins.dai;
            const tokenOutAddr = addresses.stablecoins.zunUSD;
            const impersonate = '0xBF293D5138a2a1BA407B43672643434C43827179';
            const amount = tokenify('100');
            const minAmountOut = tokenify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });

    describe('crvUSD', () => {
        it('should swap crvUSD to USDT', async () => {
            const tokenInAddr = addresses.stablecoins.crvUSD;
            const tokenOutAddr = addresses.stablecoins.usdt;
            const impersonate = '0x0a7b9483030994016567b3B1B4bbB865578901Cb';
            const amount = tokenify('100');
            const minAmountOut = stablify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap crvUSD to USDC', async () => {
            const tokenInAddr = addresses.stablecoins.crvUSD;
            const tokenOutAddr = addresses.stablecoins.usdc;
            const impersonate = '0x0a7b9483030994016567b3B1B4bbB865578901Cb';
            const amount = tokenify('100');
            const minAmountOut = stablify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap crvUSD to DAI', async () => {
            const tokenInAddr = addresses.stablecoins.crvUSD;
            const tokenOutAddr = addresses.stablecoins.dai;
            const impersonate = '0x0a7b9483030994016567b3B1B4bbB865578901Cb';
            const amount = tokenify('100');
            const minAmountOut = tokenify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap crvUSD to zunUSD', async () => {
            const tokenInAddr = addresses.stablecoins.crvUSD;
            const tokenOutAddr = addresses.stablecoins.zunUSD;
            const impersonate = '0x0a7b9483030994016567b3B1B4bbB865578901Cb';
            const amount = tokenify('100');
            const minAmountOut = tokenify('99');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });

    describe('FrxETH', () => {
        it('should swap FrxETH to WETH', async () => {
            const tokenInAddr = addresses.crypto.frxETH;
            const tokenOutAddr = addresses.crypto.WETH;
            const impersonate = '0x48c6074fFcB8fb67D75CCD06571B42542ED82555';
            const amount = tokenify('1');
            const minAmountOut = tokenify('0.98');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('1'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap FrxETH to zunETH', async () => {
            const tokenInAddr = addresses.crypto.frxETH;
            const tokenOutAddr = addresses.crypto.zunETH;
            const impersonate = '0x48c6074fFcB8fb67D75CCD06571B42542ED82555';
            const amount = tokenify('1');
            // const minAmountOut = tokenify('0.98');
            const minAmountOut = 0;

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('1'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });

    describe('WETH', () => {
        it('should swap WETH to FrxETH', async () => {
            const tokenInAddr = addresses.crypto.WETH;
            const tokenOutAddr = addresses.crypto.frxETH;
            const impersonate = '0x57757E3D981446D585Af0D9Ae4d7DF6D64647806';
            const amount = tokenify('1');
            const minAmountOut = tokenify('0.98');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('1'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap WETH to zunETH', async () => {
            const tokenInAddr = addresses.crypto.WETH;
            const tokenOutAddr = addresses.crypto.zunETH;
            const impersonate = '0x57757E3D981446D585Af0D9Ae4d7DF6D64647806';
            const amount = tokenify('1');
            const minAmountOut = tokenify('0.98');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('1'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });

    describe('zunETH', () => {
        it('should swap zunETH to FrxETH', async () => {
            const tokenInAddr = addresses.crypto.zunETH;
            const tokenOutAddr = addresses.crypto.frxETH;
            const impersonate = '0x48c6074fFcB8fb67D75CCD06571B42542ED82555';

            await network.provider.request({
                method: 'hardhat_impersonateAccount',
                params: [impersonate],
            });
            const whale = await ethers.getSigner(impersonate);
            await admin.sendTransaction({
                to: whale.address,
                value: ethers.utils.parseEther('10.0'),
            });
            const pool = await ethers.getContractAt(
                'ICurvePoolN',
                '0x3a65cbaebbfecbea5d0cb523ab56fdbda7ff9aaa'
            );
            const token = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await token.connect(whale).approve(pool.address, ethers.constants.MaxUint256);
            await pool.connect(whale).exchange(1, 0, tokenify('2.2'), 0);

            const amount = tokenify('1');
            const minAmountOut = tokenify('0.98');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('1'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap zunETH to WETH', async () => {
            const tokenInAddr = addresses.crypto.zunETH;
            const tokenOutAddr = addresses.crypto.WETH;
            const impersonate = '0x48c6074fFcB8fb67D75CCD06571B42542ED82555';

            const amount = tokenify('1');
            const minAmountOut = tokenify('0.98');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, amount, admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });

    describe('CRV', () => {
        it('should swap CRV to zunETH', async () => {
            const tokenInAddr = addresses.crypto.crv;
            const tokenOutAddr = addresses.crypto.zunETH;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = tokenify('100');
            const minAmountOut = tokenify('0.01');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter.connect(alice).handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap CRV to zunUSD', async () => {
            const tokenInAddr = addresses.crypto.crv;
            const tokenOutAddr = addresses.stablecoins.zunUSD;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = tokenify('100');
            const minAmountOut = tokenify('40');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter
                .connect(alice)
                .handle(tokenInAddr, tokenOutAddr, amount, minAmountOut);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });

    describe('CVX', () => {
        it('should swap CVX to zunETH', async () => {
            const tokenInAddr = addresses.crypto.cvx;
            const tokenOutAddr = addresses.crypto.zunETH;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = tokenify('100');
            const minAmountOut = tokenify('0');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter.connect(alice).handle(tokenInAddr, tokenOutAddr, amount, 0);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap CVX to zunUSD', async () => {
            const tokenInAddr = addresses.crypto.cvx;
            const tokenOutAddr = addresses.stablecoins.zunUSD;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = tokenify('100');
            const minAmountOut = tokenify('0');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter.connect(alice).handle(tokenInAddr, tokenOutAddr, amount, 0);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });

    describe('SDT', () => {
        it('should swap SDT to zunETH', async () => {
            const tokenInAddr = addresses.crypto.sdt;
            const tokenOutAddr = addresses.crypto.zunETH;
            const impersonate = '0xAced00E50cb81377495ea40A1A44005fe6d2482d';
            const amount = tokenify('100');
            const minAmountOut = tokenify('0');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter.connect(alice).handle(tokenInAddr, tokenOutAddr, amount, 0);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap SDT to zunUSD', async () => {
            const tokenInAddr = addresses.crypto.sdt;
            const tokenOutAddr = addresses.stablecoins.zunUSD;
            const impersonate = '0xAced00E50cb81377495ea40A1A44005fe6d2482d';
            const amount = tokenify('100');
            const minAmountOut = tokenify('0');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);
            await tokenConverter.connect(alice).handle(tokenInAddr, tokenOutAddr, amount, 0);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });

    describe('FXS', () => {
        it('should swap FXS to zunETH', async () => {
            const tokenInAddr = addresses.crypto.fxs;
            const tokenOutAddr = addresses.crypto.zunETH;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = tokenify('100');
            const minAmountOut = tokenify('0');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);

            await tokenConverter.connect(alice).handle(tokenInAddr, tokenOutAddr, amount, 0);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });

        it('should swap FXS to zunUSD', async () => {
            const tokenInAddr = addresses.crypto.fxs;
            const tokenOutAddr = addresses.stablecoins.zunUSD;
            const impersonate = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
            const amount = tokenify('100');
            const minAmountOut = tokenify('0');

            const tokenIn = await ethers.getContractAt('ERC20Token', tokenInAddr);
            const tokenOut = await ethers.getContractAt('ERC20Token', tokenOutAddr);
            await sendTokens(impersonate, alice.address, tokenIn.address, tokenify('100'), admin);

            const balanceBefore = await tokenOut.balanceOf(alice.address);
            await tokenIn.connect(alice).transfer(tokenConverter.address, amount);

            await tokenConverter.connect(alice).handle(tokenInAddr, tokenOutAddr, amount, 0);

            expect(await tokenOut.balanceOf(alice.address)).to.be.gt(balanceBefore);
        });
    });
});
