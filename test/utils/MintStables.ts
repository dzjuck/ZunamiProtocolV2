import { ethers } from 'hardhat';

const curve_TricryptoUSDC_addr = '0x7f86bf177dd4f3494b841a37e810a34dd56c829b';
const curve_TricryptoUSDC_abi = [
    {
        stateMutability: 'payable',
        type: 'function',
        name: 'exchange_underlying',
        inputs: [
            { name: 'i', type: 'uint256' },
            { name: 'j', type: 'uint256' },
            { name: 'dx', type: 'uint256' },
            { name: 'min_dy', type: 'uint256' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    // {"stateMutability":"payable","type":"function","name":"exchange_underlying","inputs":[{"name":"i","type":"uint256"},{"name":"j","type":"uint256"},{"name":"dx","type":"uint256"},{"name":"min_dy","type":"uint256"},{"name":"receiver","type":"address"}],"outputs":[{"name":"","type":"uint256"}]}
];
const curve_3pool_addr = '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7';
const curve_3pool_abi = [
    {
        name: 'exchange',
        outputs: [],
        inputs: [
            { type: 'int128', name: 'i' },
            { type: 'int128', name: 'j' },
            { type: 'uint256', name: 'dx' },
            { type: 'uint256', name: 'min_dy' },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];

export async function mintStables(admin: SignerWithAddress, usdc, usdt, dai) {
    const curveTricryptoUSDC = new ethers.Contract(
        curve_TricryptoUSDC_addr,
        curve_TricryptoUSDC_abi,
        admin
    );

    const ethAmount = ethers.utils.parseEther('1500');
    await curveTricryptoUSDC.exchange_underlying(2, 0, ethAmount, 0, { value: ethAmount });

    const curve3pool = new ethers.Contract(curve_3pool_addr, curve_3pool_abi, admin);

    const usdcAmount = ethers.utils.parseUnits('1010000', 'mwei');

    await usdc.approve(curve3pool.address, usdcAmount);
    await curve3pool.exchange(1, 0, usdcAmount, 0); // usdc -> dai

    await usdc.approve(curve3pool.address, usdcAmount);
    await curve3pool.exchange(1, 2, usdcAmount, 0); // usdc -> usdt
}
