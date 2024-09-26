import { ethers } from 'hardhat';
import * as addrs from '../address.json';
import { abi as erc20ABI } from '../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import { abi as wethABI } from '../../artifacts/contracts/interfaces/IWETH.sol/IWETH.json';

export function attachTokens(admin: SignerWithAddress) {
    const dai = new ethers.Contract(addrs.stablecoins.dai, erc20ABI, admin);
    const usdt = new ethers.Contract(addrs.stablecoins.usdt, erc20ABI, admin);
    const usdc = new ethers.Contract(addrs.stablecoins.usdc, erc20ABI, admin);
    const wEth = new ethers.Contract(addrs.crypto.wEth, wethABI, admin);
    const frxEth = new ethers.Contract(addrs.crypto.frxETH, erc20ABI, admin);
    return { dai, usdt, usdc, wEth, frxEth };
}
