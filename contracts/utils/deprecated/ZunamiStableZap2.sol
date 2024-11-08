//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../../interfaces/IPoolController.sol';
import "../../lib/Oracle/interfaces/IOracle.sol";

contract ZunamiStableZap2 {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error SameAddress();
    error DailyMintLimitOverflow();
    error DailyRedeemLimitOverflow();
    error BrokenMinimumAmount();

    uint8 public constant POOL_ASSETS = 5;

    IPoolController immutable public zunStableController;
    IOracle immutable public oracle;
    address immutable public basedToken;

    uint256 immutable public dailyMintDuration; // in secs
    uint256 immutable public dailyMintLimit; // in minimal value

    uint256 immutable public dailyRedeemDuration; // in secs
    uint256 immutable public dailyRedeemLimit; // in minimal value

    uint256 public dailyMintTotal;
    uint256 public dailyMintCountingTimestamp; // start block timestamp of limit counting

    uint256 public dailyRedeemTotal;
    uint256 public dailyRedeemCountingTimestamp; // start block timestamp of limit counting

    constructor(
        address _zunStableController,
        address _oracle,
        uint256 _dailyMintDuration,
        uint256 _dailyMintLimit,
        uint256 _dailyRedeemDuration,
        uint256 _dailyRedeemLimit,
        address _basedToken // address(0) for USD, 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for ETH, 0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB for BTC
    ) {
        if (_zunStableController == address(0))
            revert ZeroAddress();

        zunStableController = IPoolController(_zunStableController);

        if (_oracle == address(0))
            revert ZeroAddress();

        oracle = IOracle(_oracle);

        dailyMintDuration = _dailyMintDuration;
        dailyMintLimit = _dailyMintLimit;
        dailyMintCountingTimestamp = _dailyMintDuration > 0 ? block.timestamp : 0;

        dailyRedeemDuration = _dailyRedeemDuration;
        dailyRedeemLimit = _dailyRedeemLimit;
        dailyRedeemCountingTimestamp = _dailyRedeemDuration > 0 ? block.timestamp : 0;

        basedToken = _basedToken;
    }

    function mint(
        uint256[POOL_ASSETS] memory amounts,
        address receiver,
        uint256 minAmountStable
    ) external returns (uint256) {
        if (receiver == address(0)) {
            receiver = msg.sender;
        }

        uint256 depositingAmount;

        IPool pool = zunStableController.pool();
        IERC20[POOL_ASSETS] memory tokens = pool.tokens();
        uint256[POOL_ASSETS] memory tokenDecimalsMultipliers = pool.tokenDecimalsMultipliers();
        for (uint256 i = 0; i < POOL_ASSETS; ++i) {
            IERC20 token = tokens[i];
            uint256 amount = amounts[i];
            if (address(token) != address(0) && amount > 0) {
                token.safeTransferFrom(msg.sender, address(this), amount);
                token.safeIncreaseAllowance(address(zunStableController), amount);
                depositingAmount += amount * tokenDecimalsMultipliers[i];
            }
        }

        _verifyMintLimits(depositingAmount);

        uint256 zunStableAmount = zunStableController.deposit(amounts, receiver);
        if (zunStableAmount < minAmountStable) revert BrokenMinimumAmount();
        return zunStableAmount;
    }

    function estimateMint(
        uint256[POOL_ASSETS] memory amounts
    ) external view returns (uint256) {

        uint256 depositSid = zunStableController.defaultDepositSid();
        IPool pool = zunStableController.pool();
        IStrategy strategy = pool.strategyInfo(depositSid).strategy;

        return strategy.calcTokenAmount(amounts, true);
    }

    function _verifyMintLimits(
        uint256 value
    ) internal {
        uint256 dailyDuration = dailyMintDuration;
        if (dailyDuration > 0) {
            if (block.timestamp > dailyMintCountingTimestamp + dailyDuration) {
                dailyMintTotal = value;
                dailyMintCountingTimestamp = block.timestamp;
            } else {
                dailyMintTotal += value;
            }
            if(dailyMintTotal > dailyMintLimit) revert DailyMintLimitOverflow();
        }
    }

    function redeem(
        uint256 zunStableAmount,
        address receiver,
        uint256 minAmountBased
    ) external {
        _verifyRedeemLimits(zunStableAmount);

        IERC20 zunStable = IERC20(zunStableController.pool());
        zunStable.safeTransferFrom(msg.sender, address(this), zunStableAmount);
        zunStable.safeIncreaseAllowance(address(zunStableController), zunStableAmount);
        zunStableController.withdraw(zunStableAmount, [uint256(0),0,0,0,0], address(this));

        uint256 usdAmount;
        IPool pool = zunStableController.pool();
        IERC20[POOL_ASSETS] memory tokens = pool.tokens();
        uint256[POOL_ASSETS] memory tokenDecimalsMultipliers = pool.tokenDecimalsMultipliers();
        for (uint256 i = 0; i < POOL_ASSETS; ++i) {
            IERC20 token = tokens[i];
            if (address(token) != address(0)) {
                uint256 tokenBalance = token.balanceOf(address(this));
                if (tokenBalance > 0) {
                    token.safeTransfer(receiver, tokenBalance);
                    usdAmount += oracle.getUSDPrice(address(token)) * tokenBalance * tokenDecimalsMultipliers[i] / 1e18;
                }
            }
        }

        uint256 basedAmount = usdAmount;
        if (basedToken != address(0)) {
            basedAmount = usdAmount * 1e18 / oracle.getUSDPrice(basedToken);
        }

        if ( basedAmount < minAmountBased) revert BrokenMinimumAmount();
    }

    function _verifyRedeemLimits(
        uint256 value
    ) internal {
        uint256 dailyDuration = dailyRedeemDuration;
        if (dailyDuration > 0) {
            if (block.timestamp > dailyRedeemCountingTimestamp + dailyDuration) {
                dailyRedeemTotal = value;
                dailyRedeemCountingTimestamp = block.timestamp;
            } else {
                dailyRedeemTotal += value;
            }
            if(dailyRedeemTotal > dailyRedeemLimit) revert DailyRedeemLimitOverflow();
        }
    }
}
