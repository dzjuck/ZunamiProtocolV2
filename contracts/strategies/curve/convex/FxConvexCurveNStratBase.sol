//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../CurveNStratBase.sol';
import '../../../interfaces/IConvexRewards.sol';
import '../../../interfaces/IConvexStakingBooster.sol';
import "../../../interfaces/fx/IStakingProxyERC20.sol";

abstract contract FxConvexCurveNStratBase is CurveNStratBase {
    using SafeERC20 for IERC20;

    error WrongBoosterDepositAll();
    event LockedLonger(uint256 newLockTimestamp);
    event SetLockingIntervalSec(uint256 lockingIntervalSec);

    uint256 public immutable cvxPID;
    IConvexStakingBooster public immutable cvxBooster;

    IStakingProxyERC20 public stakingVault;

    constructor(
        IERC20[POOL_ASSETS] memory _tokens,
        uint256[POOL_ASSETS] memory _tokenDecimalsMultipliers,
        address _poolAddr,
        address _poolTokenAddr,
        address _cvxBooster,
        uint256 _cvxPID
    ) CurveNStratBase(_tokens, _tokenDecimalsMultipliers, _poolAddr, _poolTokenAddr) {
        if (_cvxBooster == address(0)) revert ZeroAddress();
        cvxBooster = IConvexStakingBooster(_cvxBooster);

        if (_cvxPID == 0) revert ZeroValue();
        cvxPID = _cvxPID;
    }

    function depositBooster(uint256 amount) internal override {
        if (address(stakingVault) == address(0)) {
            stakingVault = IStakingProxyERC20(cvxBooster.createVault(cvxPID));
        }

        poolToken.safeIncreaseAllowance(address(stakingVault), amount);
        stakingVault.deposit(amount);
    }

    function removeLiquidity(
        uint256 amount,
        uint256[POOL_ASSETS] memory minTokenAmounts,
        bool removeAll
    ) internal virtual override {
        stakingVault.withdraw(amount);

        super.removeLiquidity(amount, minTokenAmounts, removeAll);
    }

    function claimCollectedRewards() internal virtual override {
        if (address(stakingVault) == address(0)) return;

        try stakingVault.getReward(true) {} catch {
            stakingVault.getReward(false);
        }
    }
}
