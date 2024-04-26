//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import { Ownable2Step, Ownable } from '@openzeppelin/contracts/access/Ownable2Step.sol';
import '../interfaces/ICurveRouter.sol';
import '../interfaces/ITokenConverter.sol';

contract TokenConverter is ITokenConverter, Ownable2Step {
    using SafeERC20 for IERC20;

    address public immutable curveRouter;
    mapping(address => mapping(address => CurveRoute)) routes;

    uint8 public constant MAX_ROUTES_COUNT = 11;
    uint8 public constant MAX_SWAP_PARAMS_COUNT = 5;
    uint8 public constant SWAP_PARAMS_COUNT = 5;
    

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
        uint256[SWAP_PARAMS_COUNT][] memory swapParams
    ) external onlyOwner {
        if (route.length > MAX_ROUTES_COUNT) revert WrongLength();
        if (swapParams.length > MAX_SWAP_PARAMS_COUNT) revert WrongLength();
        routes[tokenIn][tokenOut] = CurveRoute(route, swapParams);
    }

    function setRoutes(
        address[] memory tokenIn,
        address[] memory tokenOut,
        address[][] memory route,
        uint256[MAX_SWAP_PARAMS_COUNT][][] memory swapParams
    ) external onlyOwner {
        if (tokenIn.length != tokenOut.length) revert WrongLength();
        if (tokenIn.length != route.length) revert WrongLength();
        if (tokenIn.length != swapParams.length) revert WrongLength();

        uint256 tokenInLength = tokenIn.length;
        for (uint256 i; i < tokenInLength; ++i) {
            if (route[i].length > MAX_ROUTES_COUNT) revert WrongLength();
            if (swapParams[i].length > MAX_SWAP_PARAMS_COUNT) revert WrongLength();
            routes[tokenIn[i]][tokenOut[i]] = CurveRoute(route[i], swapParams[i]);
        }
    }

    function handle(
        address tokenIn_,
        address tokenOut_,
        uint256 amountIn_,
        uint256 minAmountOut_
    ) external returns (uint256 amountOut) {
        if (amountIn_ == 0) return 0;

        IERC20(tokenIn_).safeIncreaseAllowance(curveRouter, amountIn_);

        address[MAX_ROUTES_COUNT] memory routes_ = _fillRoutes(tokenIn_, tokenOut_);
        uint256[SWAP_PARAMS_COUNT][MAX_SWAP_PARAMS_COUNT] memory swapParams_ = _fillSwapParams(tokenIn_, tokenOut_);

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

        address[MAX_ROUTES_COUNT] memory routes_ = _fillRoutes(tokenIn_, tokenOut_);
        uint256[SWAP_PARAMS_COUNT][MAX_SWAP_PARAMS_COUNT] memory swapParams_ = _fillSwapParams(tokenIn_, tokenOut_);

        return ICurveRouterV1(curveRouter).get_dy(routes_, swapParams_, amountIn_);
    }

    function _fillRoutes(
        address tokenIn_,
        address tokenOut_
    ) internal view returns (address[MAX_ROUTES_COUNT] memory routes_) {
        uint256 routesLength = routes[tokenIn_][tokenOut_].route.length;
        for (uint8 i; i < routesLength; ++i) {
            routes_[i] = routes[tokenIn_][tokenOut_].route[i];
        }
    }

    function _fillSwapParams(
        address tokenIn_,
        address tokenOut_
    ) internal view returns (uint256[SWAP_PARAMS_COUNT][MAX_SWAP_PARAMS_COUNT] memory swapParams_) {
        uint256 swapParamsLength = routes[tokenIn_][tokenOut_].swapParams.length;
        for (uint8 i; i < swapParamsLength; ++i) {
            swapParams_[i] = routes[tokenIn_][tokenOut_].swapParams[i];
        }
    }
}
