import { ethers } from 'hardhat';
import * as addrs from '../address.json';
import { abi as erc20ABI } from '../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';

export function createStablecoins(admin: SignerWithAddress) {
    const dai = new ethers.Contract(addrs.stablecoins.dai, erc20ABI, admin);
    const usdt = new ethers.Contract(addrs.stablecoins.usdt, erc20ABI, admin);
    const usdc = new ethers.Contract(addrs.stablecoins.usdc, erc20ABI, admin);
    return { dai, usdt, usdc };
}
