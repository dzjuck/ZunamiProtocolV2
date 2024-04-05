//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../ERC4626StratBase.sol';
import '../../../interfaces/IStakeDaoVault.sol';

abstract contract StakeDaoERC4626StratBase is ERC4626StratBase {
    using SafeERC20 for IERC20;

    IStakeDaoVault public immutable vaultSd;

    constructor(
        IERC20[POOL_ASSETS] memory _tokens,
        uint256[POOL_ASSETS] memory _tokenDecimalsMultipliers,
        address _vault4626Addr,
        address _vaultAssetAddr,
        address _vaultSdAddr
    ) ERC4626StratBase(_tokens, _tokenDecimalsMultipliers, _vault4626Addr, _vaultAssetAddr) {
        if (_vaultSdAddr == address(0)) revert ZeroAddress();
        vaultSd = IStakeDaoVault(_vaultSdAddr);
    }

    function depositLiquidity(
        uint256[POOL_ASSETS] memory amounts
    ) internal override returns (uint256 liquidityAmount) {
        liquidityAmount = super.depositLiquidity(amounts);
        IERC20(vault).safeIncreaseAllowance(address(vaultSd), liquidityAmount);
        vaultSd.deposit(address(this), liquidityAmount, true);
    }

    function removeLiquidity(
        uint256 amount,
        uint256[POOL_ASSETS] memory minTokenAmounts,
        bool removeAll
    ) internal virtual override {
        vaultSd.withdraw(amount);
        super.removeLiquidity(amount, minTokenAmounts, removeAll);
    }

    function claimCollectedRewards() internal override {
        vaultSd.liquidityGauge().claim_rewards();
        super.claimCollectedRewards();
    }
}
