import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

export function getMinAmountZunBTC(amount: string): BigNumber[] {
    const zero = ethers.utils.parseUnits('0', 'ether');
    const wBtc = ethers.utils.parseUnits(amount, '8');
    const tBtc = ethers.utils.parseUnits(amount, 'ether');
    return [wBtc, tBtc, zero, zero, zero];
}
