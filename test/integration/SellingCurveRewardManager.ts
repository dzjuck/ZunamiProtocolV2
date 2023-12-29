import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { StableConverter } from '../../typechain-types';
import { expect } from 'chai';
import { ethers, network } from 'hardhat';
import { parseUnits } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

import { abi as erc20ABI } from '../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';

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

const tokens = [
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // dai
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // usdc
    '0xdAC17F958D2ee523a2206206994597C13D831ec7', // usdt
];

const rewards = [
    '0xD533a949740bb3306d119CC777fa900bA034cd52', // crv
    '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B', // cvx
    '0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0', //fxs
    '0x090185f2135308BaD17527004364eBcC2D37e5F6', //spell
];

const rewardVaults = [
    '0xF977814e90dA44bFA03b6295A0616a897441aceC', // crv
    '0x28C6c06298d514Db089934071355E5743bf21d60', // cvx
    '0xb744bEA7E6892c380B781151554C7eBCc764910b', // fxs
    '0x46f80018211D5cBBc988e853A8683501FCA4ee9b', // spell
];

describe('SellingCurveRewardManager', async () => {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount, otherAccount1] = await ethers.getSigners();

        const StableConverter = await ethers.getContractFactory('StableConverter');
        const converter = (await StableConverter.deploy()) as StableConverter;

        const SellingCurveRewardManager = await ethers.getContractFactory(
            'SellingCurveRewardManager'
        );
        const rewardManager = (await SellingCurveRewardManager.deploy(
            converter.address
        )) as SellingCurveRewardManager;

        return {
            owner,
            otherAccount,
            otherAccount1,
            rewardManager,
            converter,
        };
    }

    it('should correctly deploy the contracts', async () => {
        const { owner, rewardManager, converter } = await loadFixture(deployFixture);

        expect(await rewardManager.stableConverter()).to.equal(converter.address);
    });

    it('should correctly valuate rewards in stables', async () => {
        // given
        const { rewardManager } = await loadFixture(deployFixture);

        const amount = ethers.utils.parseEther('100');
        for (const reward of rewards) {
            for (const token of tokens) {
                expect(await rewardManager.valuate(reward, amount.toString(), token)).greaterThan(
                    0
                );
            }
        }
    });

    it('should correctly sell rewards to stables', async () => {
        const { owner, rewardManager } = await loadFixture(deployFixture);

        for (const token of tokens) {
            const tokenContract = new ethers.Contract(token, erc20ABI, owner);

            const amount = ethers.utils.parseEther('100');
            for (let i = 0; i < rewards.length; i++) {
                const frxEthBalanceBefore = await tokenContract.balanceOf(owner.address);

                await mintTokenTo(
                    rewardManager.address,
                    owner,
                    rewards[i],
                    rewardVaults[i],
                    amount
                );
                await rewardManager.handle(rewards[i], amount.toString(), token);

                const frxEthBalanceAfter = await tokenContract.balanceOf(owner.address);

                expect(frxEthBalanceAfter).to.gt(frxEthBalanceBefore);
            }
        }
    });
});
