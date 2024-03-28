//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface ITokenConverter {
    function handle(
        address tokenIn,
        address tokenOut,
        uint256 amount,
        uint256 minAmountOut
    ) external returns (uint256);

    function valuate(
        address tokenIn_,
        address tokenOut_,
        uint256 amountIn_
    ) external view returns (uint256);
}
