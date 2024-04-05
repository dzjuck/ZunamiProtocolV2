//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../StakeDaoCurveStratBase.sol';

abstract contract EmergencyAdminStakeDaoCurveStratBase is StakeDaoCurveStratBase {
    bytes32 public constant EMERGENCY_ADMIN_ROLE = keccak256('EMERGENCY_ADMIN_ROLE');

    constructor(
        IERC20[POOL_ASSETS] memory _tokens,
        uint256[POOL_ASSETS] memory _tokenDecimalsMultipliers,
        address _vaultAddr,
        address _poolAddr,
        address _poolTokenAddr
    )
        StakeDaoCurveStratBase(
            _tokens,
            _tokenDecimalsMultipliers,
            _vaultAddr,
            _poolAddr,
            _poolTokenAddr
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
}
