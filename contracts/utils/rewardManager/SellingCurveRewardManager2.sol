//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/access/Ownable2Step.sol';
import '../../interfaces/IRewardManager.sol';
import '../../interfaces/ITokenConverter.sol';
import '../../lib/Oracle/interfaces/IOracle.sol';

contract SellingCurveRewardManager2 is IRewardManager, Ownable2Step {
    using SafeERC20 for IERC20;

    error MinAmount();

    uint256 public constant SLIPPAGE_DENOMINATOR = 10_000;

    uint256 public defaultSlippage = 300; // 3%

    ITokenConverter public immutable tokenConverter;
    IOracle public immutable oracle;

    event SetDefaultSlippage(uint256 newDefaultSlippage);

    error ZeroAddress();
    error ZeroSlippage();
    error WrongSlippage();

    constructor(address tokenConverterAddr, address oracleAddr) Ownable(msg.sender) {
        if (tokenConverterAddr == address(0)) revert ZeroAddress();
        tokenConverter = ITokenConverter(tokenConverterAddr);

        if (oracleAddr == address(0)) revert ZeroAddress();
        oracle = IOracle(oracleAddr);
    }

    function setDefaultSlippage(uint256 defaultSlippage_) external onlyOwner {
        if (defaultSlippage_ == 0) revert ZeroSlippage();
        if (defaultSlippage_ > SLIPPAGE_DENOMINATOR) revert WrongSlippage();
        defaultSlippage = defaultSlippage_;
        emit SetDefaultSlippage(defaultSlippage_);
    }

    function handle(address reward, uint256 amount, address receivingToken) external {
        if (amount == 0) return;

        if (reward == receivingToken) {
            IERC20(receivingToken).safeTransfer(address(msg.sender), amount);
            return;
        }

        IERC20(reward).safeTransfer(address(tokenConverter), amount);
        tokenConverter.handle(
            reward,
            receivingToken,
            amount,
            calcMinAmount(reward, amount, receivingToken)
        );

        uint256 receivingTokenAmount = IERC20(receivingToken).balanceOf(address(this));
        IERC20(receivingToken).safeTransfer(msg.sender, receivingTokenAmount);
    }

    function valuate(
        address reward,
        uint256 amount,
        address feeToken
    ) external view returns (uint256 valuatedAmount) {
        if (amount == 0) return 0;

        valuatedAmount = tokenConverter.valuate(reward, feeToken, amount);
        if (valuatedAmount < calcMinAmount(reward, amount, feeToken)) revert MinAmount();
    }

    function calcMinAmount(
        address tokenIn,
        uint256 amountIn,
        address tokenOut
    ) internal view returns (uint256 amountOutMin) {
        uint256 value = (oracle.getUSDPrice(tokenIn) * amountIn) / 1e18; //TODO: multiply by reward decimals in < 18
        uint256 feeTokenPrice = oracle.getUSDPrice(tokenOut);
        amountOutMin =
            ((value * (SLIPPAGE_DENOMINATOR - defaultSlippage)) * 1e18) /
            (SLIPPAGE_DENOMINATOR * feeTokenPrice);
    }
}
