//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ZunamiStratBase.sol";
import "./interfaces/IStakeDaoVault.sol";

abstract contract StakeDaoStratBase is ZunamiStratBase {

    IStakeDaoVault public immutable vault;

    constructor(address _vaultAddr) {
        vault = IStakeDaoVault(_vaultAddr);
    }

    function depositLiquidity(uint256 amount) internal {
        vault.deposit(address(this), amount, true);
    }

    function removeLiquidity(uint256 amount, uint256[5] memory) internal override virtual {
        vault.withdraw(amount);
    }

    function removeAllLiquidity() internal override virtual {
        vault.withdraw(vault.liquidityGauge().balanceOf(address(this)));
    }

    function claimCollectedRewards() internal override virtual {
        vault.liquidityGauge().claim_rewards();
    }

    function getLiquidityBalance() internal view override virtual returns(uint256) {
        return vault.liquidityGauge().balanceOf(address(this));
    }
}
