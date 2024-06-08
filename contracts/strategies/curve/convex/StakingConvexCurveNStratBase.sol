//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../CurveNStratBase.sol';
import '../../../interfaces/IConvexRewards.sol';
import '../../../interfaces/IConvexStakingBooster.sol';
import "../../../interfaces/IStakingProxyConvex.sol";

abstract contract StakingConvexCurveNStratBase is CurveNStratBase {
    using SafeERC20 for IERC20;

    error WrongBoosterDepositAll();
    event LockedLonger(uint256 newLockTimestamp);
    event SetLockingIntervalSec(uint256 lockingIntervalSec);

    uint256 public immutable cvxPID;
    IConvexStakingBooster public immutable cvxBooster;
    IConvexRewards public immutable cvxRewards;

    IStakingProxyConvex public stakingVault;
    bytes32 public kekId;
    uint256 public lockingIntervalSec;

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

        _setLockingIntervalSec(604800); // 7 days
    }

    function _setLockingIntervalSec(uint256 _lockingIntervalSec) internal {
        lockingIntervalSec = _lockingIntervalSec;
        emit SetLockingIntervalSec(_lockingIntervalSec);
    }

    function depositBooster(uint256 amount) internal override {
        if (address(stakingVault) == address(0)) {
            stakingVault = IStakingProxyConvex(cvxBooster.createVault(cvxPID));
        }

        poolToken.safeIncreaseAllowance(address(stakingVault), amount);
        if (kekId == 0) {
            kekId = stakingVault.stakeLockedCurveLp(amount, lockingIntervalSec);
        } else {
            stakingVault.lockAdditionalCurveLp(kekId, amount);
        }
    }

    function releaseLiquidity() internal {
        stakingVault.withdrawLockedAndUnwrap(kekId);
        kekId = 0;
    }

    function removeLiquidity(
        uint256 amount,
        uint256[POOL_ASSETS] memory minTokenAmounts,
        bool removeAll
    ) internal virtual override {
        // release all liquidity
        releaseLiquidity();

        if (!removeAll) {
            // stake back other liquidity
            depositBooster(poolToken.balanceOf(address(this)) - amount);
        }

        super.removeLiquidity(amount, minTokenAmounts, removeAll);
    }

    function claimCollectedRewards() internal virtual override {
        if (address(stakingVault) == address(0)) return;

        try stakingVault.getReward(true) {} catch {
            stakingVault.getReward(false);
        }
    }
}
