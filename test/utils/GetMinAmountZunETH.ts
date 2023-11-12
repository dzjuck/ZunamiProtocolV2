import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

export function getMinAmountZunETH(amount: string): BigNumber[] {
    const zero = ethers.utils.parseUnits('0', 'ether');
    const weth = ethers.utils.parseUnits(amount, 'ether');
    const frxEth = ethers.utils.parseUnits(amount, 'ether');
    return [weth, frxEth, zero, zero, zero];
}
