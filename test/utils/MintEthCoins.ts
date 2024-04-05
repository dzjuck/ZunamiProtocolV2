import { ethers } from 'hardhat';

const frxETH_minter_addr = '0xbAFA44EFE7901E04E39Dad13167D089C559c1138';
const frxETH_minter_abi = [
    { inputs: [], name: 'submit', outputs: [], stateMutability: 'payable', type: 'function' },
];

export async function mintEthCoins(admin: SignerWithAddress, wEth) {
    const frxETHMinter = new ethers.Contract(frxETH_minter_addr, frxETH_minter_abi, admin);

    const ethAmount = ethers.utils.parseEther('1000');
    await wEth.deposit({ value: ethAmount });
    await frxETHMinter.submit({ value: ethAmount });
}
