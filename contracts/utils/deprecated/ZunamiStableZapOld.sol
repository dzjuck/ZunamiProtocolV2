//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../../interfaces/IPoolController.sol';

contract ZunamiStableZapOld {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error SameAddress();
    error DailyMintLimitOverflow();
    error DailyRedeemLimitOverflow();

    uint8 public constant POOL_ASSETS = 5;

    IPoolController immutable public zunStableController;

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
        uint256 _dailyMintDuration,
        uint256 _dailyMintLimit,
        uint256 _dailyRedeemDuration,
        uint256 _dailyRedeemLimit
    ) {
        if (_zunStableController == address(0))
            revert ZeroAddress();

        zunStableController = IPoolController(_zunStableController);

        dailyMintDuration = _dailyMintDuration;
        dailyMintLimit = _dailyMintLimit;
        dailyMintCountingTimestamp = _dailyMintDuration > 0 ? block.timestamp : 0;

        dailyRedeemDuration = _dailyRedeemDuration;
        dailyRedeemLimit = _dailyRedeemLimit;
        dailyRedeemCountingTimestamp = _dailyRedeemDuration > 0 ? block.timestamp : 0;
    }

    function mint(
        uint256[POOL_ASSETS] memory amounts,
        address receiver
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

        return zunStableController.deposit(amounts, receiver);
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
        uint256[5] memory minAmounts
    ) external {
        _verifyRedeemLimits(zunStableAmount);

        IERC20 zunStable = IERC20(zunStableController.pool());
        zunStable.safeTransferFrom(msg.sender, address(this), zunStableAmount);
        zunStable.safeIncreaseAllowance(address(zunStableController), zunStableAmount);
        zunStableController.withdraw(zunStableAmount, minAmounts, receiver);
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
