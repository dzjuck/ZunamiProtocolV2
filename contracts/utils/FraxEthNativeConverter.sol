//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import './Constants.sol';
import '../interfaces/ICurvePool2.sol';
import '../interfaces/INativeConverter.sol';
import '../interfaces/IWETH.sol';

contract FraxEthNativeConverter is INativeConverter {
    using SafeERC20 for IERC20;

    error WrongSlippage();
    error BrokenSlippage();

    uint256 public constant SLIPPAGE_DENOMINATOR = 10_000;
    IERC20 public constant frxETH = IERC20(Constants.FRX_ETH_ADDRESS);
    IERC20 public constant weth = IERC20(Constants.WETH_ADDRESS);

    int128 public constant ETH_frxETH_POOL_WETH_ID = 0;
    int128 public constant ETH_frxETH_POOL_frxETH_ID = 1;

    ICurvePool2 public immutable fraxEthPool;

    uint256 public constant defaultSlippage = 50; // 0.5%

    constructor() {
        fraxEthPool = ICurvePool2(Constants.WETH_frxETH_ADDRESS);
    }

    function handle(
        bool buyToken,
        uint256 amount,
        uint256 slippage
    ) public returns (uint256 tokenAmount) {
        if (amount == 0) return 0;

        if (buyToken) {
            weth.safeIncreaseAllowance(address(fraxEthPool), amount);
            tokenAmount = fraxEthPool.exchange(
                ETH_frxETH_POOL_WETH_ID,
                ETH_frxETH_POOL_frxETH_ID,
                amount,
                applySlippage(amount, slippage)
            );

            frxETH.safeTransfer(msg.sender, tokenAmount);
        } else {
            frxETH.safeIncreaseAllowance(address(fraxEthPool), amount);
            tokenAmount = fraxEthPool.exchange(
                ETH_frxETH_POOL_frxETH_ID,
                ETH_frxETH_POOL_WETH_ID,
                amount,
                applySlippage(amount, slippage)
            );

            weth.safeTransfer(msg.sender, tokenAmount);
        }
    }

    function valuate(bool buyToken, uint256 amount) public view returns (uint256 valuation) {
        if (amount == 0) return 0;
        int128 i = buyToken ? ETH_frxETH_POOL_WETH_ID : ETH_frxETH_POOL_frxETH_ID;
        int128 j = buyToken ? ETH_frxETH_POOL_frxETH_ID : ETH_frxETH_POOL_WETH_ID;
        valuation = fraxEthPool.get_dy(i, j, amount);

        if (valuation < applySlippage(amount, 0)) revert BrokenSlippage();
    }

    function applySlippage(uint256 amount, uint256 slippage) internal pure returns (uint256) {
        if (slippage > SLIPPAGE_DENOMINATOR) revert WrongSlippage();
        if (slippage == 0) slippage = defaultSlippage;
        return (amount * (SLIPPAGE_DENOMINATOR - slippage)) / SLIPPAGE_DENOMINATOR;
    }
}
