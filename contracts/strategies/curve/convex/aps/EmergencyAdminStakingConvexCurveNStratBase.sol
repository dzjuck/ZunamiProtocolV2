//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../StakingConvexCurveNStratBase.sol';

abstract contract EmergencyAdminStakingConvexCurveNStratBase is StakingConvexCurveNStratBase {
    bytes32 public constant EMERGENCY_ADMIN_ROLE = keccak256('EMERGENCY_ADMIN_ROLE');

    constructor(
        IERC20[POOL_ASSETS] memory _tokens,
        uint256[POOL_ASSETS] memory _tokenDecimalsMultipliers,
        address _poolAddr,
        address _poolLpAddr,
        address _cvxBooster,
        uint256 _cvxPID
    )
        StakingConvexCurveNStratBase(
            _tokens,
            _tokenDecimalsMultipliers,
            _poolAddr,
            _poolLpAddr,
            _cvxBooster,
            _cvxPID
        )
    {
        _grantRole(EMERGENCY_ADMIN_ROLE, msg.sender);
    }

    function inflate(
        uint256 ratioOfCrvLps,
        uint256 minInflatedAmount
    ) external onlyRole(EMERGENCY_ADMIN_ROLE) {
        _inflate(ratioOfCrvLps, minInflatedAmount);
    }

    function _inflate(uint256 ratioOfCrvLps, uint256 minInflatedAmount) internal virtual;

    function deflate(
        uint256 ratioOfCrvLps,
        uint256 minDeflateAmount
    ) external onlyRole(EMERGENCY_ADMIN_ROLE) {
        _deflate(ratioOfCrvLps, minDeflateAmount);
    }

    function _deflate(uint256 ratioOfCrvLps, uint256 minDeflateAmount) internal virtual;

    function stakeLonger() external onlyRole(EMERGENCY_ADMIN_ROLE) {
        uint256 newLockTimestamp = block.timestamp + lockingIntervalSec;
        stakingVault.lockLonger(kekId, newLockTimestamp);
        emit LockedLonger(newLockTimestamp);
    }
}
