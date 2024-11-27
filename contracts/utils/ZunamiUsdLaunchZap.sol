//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../interfaces/IPoolController.sol';
import '../interfaces/ITokenConverter.sol';
import '../utils/Constants.sol';
import "../tokenomics/staking/IStaking.sol";
import '../lib/Oracle/interfaces/IOracle.sol';

contract ZunamiUsdZap {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error BrokenMinimumAmount();

    uint8 public constant POOL_ASSETS = 5;

    uint256 constant ZUNAMI_CRVUSD_TOKEN_ID = 3;

    uint256 public constant MIN_AMOUNT_DENOMINATOR = 10000;
    uint256 public constant MIN_AMOUNT = 9980; // 99.80%

    IPoolController public immutable omniController;
    IPoolController public immutable apsController;
    IStaking public immutable staking;
    IERC20 public immutable rewardToken;

    constructor(
        address omniControllerAddr,
        address apsControllerAddr,
        address stakingAddr,
        address rewardTokenAddr
    ) {
        if (
            omniControllerAddr == address(0) ||
            apsControllerAddr == address(0) ||
            stakingAddr == address(0) ||
            rewardTokenAddr == address(0)
        ) revert ZeroAddress();
        omniController = IPoolController(omniControllerAddr);
        apsController = IPoolController(apsControllerAddr);
        staking = IStaking(stakingAddr);
        rewardToken = IERC20(rewardTokenAddr);
    }

    function deposit(
        uint256[POOL_ASSETS] memory amounts,
        uint256 minAmount,
        address receiver
    ) external returns (uint256 shares) {
        if (receiver == address(0)) {
            receiver = msg.sender;
        }

        IPool zunamiPool = omniController.pool();
        IERC20[POOL_ASSETS] memory tokens = zunamiPool.tokens();
        for (uint256 i = 0; i < POOL_ASSETS; ++i) {
            uint256 amount = amounts[i];
            IERC20 token = tokens[i];
            if (address(token) != address(0) && amount > 0) {
                token.safeTransferFrom(msg.sender, address(this), amount);
                token.safeIncreaseAllowance(address(omniController), amount);
            }
        }

        omniController.deposit(amounts, address(this));

        uint256 zunStableBalance = zunamiPool.balanceOf(address(this));
        IERC20(address(zunamiPool)).safeIncreaseAllowance(address(apsController), zunStableBalance);
        apsController.deposit([zunStableBalance, 0, 0, 0, 0], address(this));

        uint256 apsLpBalance = apsController.balanceOf(address(this));
        IERC20(address(apsController)).safeIncreaseAllowance(address(staking), apsLpBalance);
        staking.deposit(apsLpBalance, receiver);

        if (apsLpBalance < minAmount) revert BrokenMinimumAmount();

        return apsLpBalance;
    }

    function withdraw(uint256 amount, uint256[POOL_ASSETS] memory minTokenAmounts, address receiver) external {
        if (receiver == address(0)) {
            receiver = msg.sender;
        }

        IERC20(address(staking)).safeTransferFrom(msg.sender, address(this), amount);
        staking.withdraw(amount, true, address(this));

        uint256 rewardBalance = rewardToken.balanceOf(address(this));
        if (rewardBalance > 0) {
            rewardToken.safeTransfer(receiver, rewardBalance);
        }

        uint256 apsLpBalance = apsController.balanceOf(address(this));
        IERC20(address(apsController)).safeIncreaseAllowance(address(staking), apsLpBalance);
        apsController.withdraw(apsLpBalance, minTokenAmounts, receiver);
    }
}
