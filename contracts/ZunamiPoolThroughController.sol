//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import './ZunamiPoolControllerBase.sol';

contract ZunamiPoolThroughController is ZunamiPoolControllerBase {
    using SafeERC20 for IERC20;

    address public rewardCollector;

    constructor(address pool_) ZunamiPoolControllerBase(pool_) {
        rewardCollector = msg.sender;
    }

    function changeRewardCollector(address _rewardCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_rewardCollector == address(0)) revert ZeroAddress();
        emit RewardCollectorChanged(rewardCollector, _rewardCollector);
        rewardCollector = _rewardCollector;
    }

    function claimRewards() external whenNotPaused nonReentrant {
        claimPoolRewards(rewardCollector);
    }

    function depositPool(
        uint256[POOL_ASSETS] memory amounts,
        address receiver
    ) internal virtual override returns (uint256) {
        return depositDefaultPool(amounts, receiver);
    }

    function withdrawPool(
        address user,
        uint256 shares,
        uint256[POOL_ASSETS] memory minTokenAmounts,
        address receiver
    ) internal virtual override {
        IERC20(address(pool)).safeTransferFrom(user, address(this), shares);
        withdrawDefaultPool(shares, minTokenAmounts, receiver);
    }
}
