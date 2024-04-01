//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import { Ownable2Step, Ownable } from '@openzeppelin/contracts/access/Ownable2Step.sol';
import '../utils/Constants.sol';
import '../interfaces/ICurveRouter.sol';
import '../interfaces/ITokenConverter.sol';

contract TokenConverter is ITokenConverter, Ownable2Step {
    using SafeERC20 for IERC20;

    address public immutable curveRouter;
    mapping(address => mapping(address => CurveRoute)) routes;

    error ZeroAddress();
    error WrongLength();

    constructor(address curveRouter_) Ownable(msg.sender) {
        if (curveRouter_ == address(0)) revert ZeroAddress();
        curveRouter = curveRouter_;
    }

    function setRoute(
        address tokenIn,
        address tokenOut,
        address[] memory route,
        uint256[5][] memory swapParams
    ) external onlyOwner {
        routes[tokenIn][tokenOut] = CurveRoute(route, swapParams);
    }

    function setRoutes(
        address[] memory tokenIn,
        address[] memory tokenOut,
        address[][] memory route,
        uint256[5][][] memory swapParams
    ) external onlyOwner {
        if (tokenIn.length != tokenOut.length) revert WrongLength();
        if (tokenIn.length != route.length) revert WrongLength();
        if (tokenIn.length != swapParams.length) revert WrongLength();

        for (uint256 i; i < tokenIn.length; ++i) {
            routes[tokenIn[i]][tokenOut[i]] = CurveRoute(route[i], swapParams[i]);
        }
    }

    function handle(
        address tokenIn_,
        address tokenOut_,
        uint256 amountIn_,
        uint256 minAmountOut_
    ) public returns (uint256 amountOut) {
        if (amountIn_ == 0) return 0;

        IERC20(tokenIn_).safeIncreaseAllowance(curveRouter, amountIn_);

        address[11] memory routes_ = _fillRoutes(tokenIn_, tokenOut_);
        uint256[5][5] memory swapParams_ = _fillSwapParams(tokenIn_, tokenOut_);

        amountOut = ICurveRouterV1(curveRouter).exchange(
            routes_,
            swapParams_,
            amountIn_,
            minAmountOut_
        );
        IERC20 tokenOut = IERC20(tokenOut_);
        tokenOut.safeTransfer(msg.sender, amountOut);
    }

    function valuate(
        address tokenIn_,
        address tokenOut_,
        uint256 amountIn_
    ) external view returns (uint256) {
        if (amountIn_ == 0) return 0;

        address[11] memory routes_ = _fillRoutes(tokenIn_, tokenOut_);
        uint256[5][5] memory swapParams_ = _fillSwapParams(tokenIn_, tokenOut_);

        return ICurveRouterV1(curveRouter).get_dy(routes_, swapParams_, amountIn_);
    }

    function _fillRoutes(
        address tokenIn_,
        address tokenOut_
    ) internal view returns (address[11] memory routes_) {
        for (uint8 i; i < routes[tokenIn_][tokenOut_].route.length; ++i) {
            routes_[i] = routes[tokenIn_][tokenOut_].route[i];
        }
    }

    function _fillSwapParams(
        address tokenIn_,
        address tokenOut_
    ) internal view returns (uint256[5][5] memory swapParams_) {
        for (uint8 i; i < routes[tokenIn_][tokenOut_].swapParams.length; ++i) {
            swapParams_[i] = routes[tokenIn_][tokenOut_].swapParams[i];
        }
    }
}
