//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../interfaces/IPoolController.sol';
import '../interfaces/ITokenConverter.sol';
import '../utils/Constants.sol';
import "../tokenomics/staking/ILockedStaking.sol";
import '../lib/Oracle/interfaces/IOracle.sol';

contract ZunamiDepositStakedApsZap {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error SameAddress();

    uint8 public constant POOL_ASSETS = 5;

    uint256 public constant MIN_AMOUNT_DENOMINATOR = 10000;
    uint256 public constant MIN_AMOUNT = 9980; // 99.80%

    IPool public immutable apsPool;
    IPoolController public immutable apsController;
    ILockedStaking public immutable staking;

    constructor(address apsControllerAddr, address stakingAddr) {
        if (
            apsControllerAddr == address(0) ||
            stakingAddr == address(0)
        ) revert ZeroAddress();
        apsController = IPoolController(apsControllerAddr);
        staking = ILockedStaking(stakingAddr);

        apsPool = apsController.pool();
    }

    function deposit(
        uint256[POOL_ASSETS] memory amounts,
        address receiver
    ) external returns (uint256 shares) {
        if (receiver == address(0)) {
            receiver = msg.sender;
        }

        IERC20[POOL_ASSETS] memory tokens = apsPool.tokens();
        for (uint256 i = 0; i < amounts.length; ++i) {
            uint256 amount = amounts[i];
            IERC20 token = tokens[i];
            if (address(token) != address(0) && amount > 0) {
                token.safeTransferFrom(msg.sender, address(this), amount);
                token.safeIncreaseAllowance(address(apsController), amount);
            }
        }

        apsController.deposit(amounts, address(this));

        uint256 apsLpBalance = apsController.balanceOf(address(this));
        IERC20(address(apsController)).safeIncreaseAllowance(address(staking), apsLpBalance);
        staking.deposit(apsLpBalance, receiver);

        return apsLpBalance;
    }
}
