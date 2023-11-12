import { ethers } from 'hardhat';
import * as addrs from '../address.json';
import { abi as erc20ABI } from '../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import { abi as wethABI } from '../../artifacts/contracts/interfaces/IWETH.sol/IWETH.json';

export function createEthCoins(admin: SignerWithAddress) {
    const wEth = new ethers.Contract(addrs.stablecoins.wEth, wethABI, admin);
    const frxEth = new ethers.Contract(addrs.stablecoins.frxEth, erc20ABI, admin);
    return { wEth, frxEth };
}
