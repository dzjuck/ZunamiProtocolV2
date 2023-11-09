import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

export function getMinAmountZunUSD(amount: string): BigNumber[] {
    const zero = ethers.utils.parseUnits('0', 'ether');
    const dai = ethers.utils.parseUnits(amount, 'ether');
    const usdc = ethers.utils.parseUnits(amount, 'mwei');
    const usdt = ethers.utils.parseUnits(amount, 'mwei');
    return [dai, usdc, usdt, zero, zero];
}
