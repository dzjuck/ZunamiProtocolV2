//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';
import '@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol';

import './ZunamiPoolControllerBase.sol';

contract ZunamiPoolThroughController is ZunamiPoolControllerBase {
    using SafeERC20 for IERC20;

    event RewardCollectorChanged(address oldFeeCollector, address newFeeCollector);

    constructor(address pool_) ZunamiPoolControllerBase(pool_) {
        rewardCollector = msg.sender;
    }

    function changeRewardCollector(address _rewardCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit RewardCollectorChanged(rewardCollector, _rewardCollector);
        rewardCollector = _rewardCollector;
    }

    function claimRewards() external whenNotPaused nonReentrant {
        claimPoolRewards(rewardCollector);
    }

    function depositPool(
        uint256[POOL_ASSETS] memory amounts,
        address receiver
    ) internal override returns (uint256) {
        return depositDefaultPool(amounts, receiver);
    }

    function withdrawPool(
        address user,
        uint256 shares,
        uint256[POOL_ASSETS] memory minTokenAmounts,
        address receiver
    ) internal override {
        IERC20(address(pool)).safeTransferFrom(user, address(this), shares);
        withdrawDefaultPool(shares, minTokenAmounts, receiver);
    }
}
