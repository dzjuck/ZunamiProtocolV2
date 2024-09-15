import { ethers } from 'hardhat';
import * as addrs from '../address.json';
import { abi as erc20ABI } from '../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import { abi as wethABI } from '../../artifacts/contracts/interfaces/IWETH.sol/IWETH.json';
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";

export function createBtcCoins(admin: SignerWithAddress) {
    const wBtc = new ethers.Contract(addrs.crypto.wBtc, erc20ABI, admin);
    const tBtc = new ethers.Contract(addrs.crypto.tBtc, erc20ABI, admin);
    return { wBtc, tBtc };
}
