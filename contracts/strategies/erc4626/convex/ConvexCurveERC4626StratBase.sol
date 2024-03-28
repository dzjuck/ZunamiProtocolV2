//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../ERC4626StratBase.sol';
import '../../../interfaces/IConvexBooster.sol';
import '../../../interfaces/IConvexRewards.sol';

abstract contract ConvexCurveERC4626StratBase is ERC4626StratBase {
    using SafeERC20 for IERC20;

    error WrongBoosterDepositAll();

    uint256 public immutable cvxPID;
    IConvexBooster public immutable cvxBooster;
    IConvexRewards public immutable cvxRewards;

    constructor(
        IERC20[POOL_ASSETS] memory _tokens,
        uint256[POOL_ASSETS] memory _tokenDecimalsMultipliers,
        address _vaultAddr,
        address _vaultAssetAddr,
        address _cvxBooster,
        address _cvxRewardsAddr,
        uint256 _cvxPID
    ) ERC4626StratBase(_tokens, _tokenDecimalsMultipliers, _vaultAddr, _vaultAssetAddr) {
        if (_cvxBooster == address(0)) revert ZeroAddress();
        cvxBooster = IConvexBooster(_cvxBooster);

        if (_cvxRewardsAddr == address(0)) revert ZeroAddress();
        cvxRewards = IConvexRewards(_cvxRewardsAddr);

        if (_cvxPID == 0) revert ZeroValue();
        cvxPID = _cvxPID;
    }

    function depositLiquidity(
        uint256[POOL_ASSETS] memory amounts
    ) internal override returns (uint256 liquidityAmount) {
        liquidityAmount = super.depositLiquidity(amounts);
        IERC20(vault).safeIncreaseAllowance(address(cvxBooster), liquidityAmount);
        if (!cvxBooster.deposit(cvxPID, liquidityAmount, true)) revert WrongBoosterDepositAll();
    }

    function removeLiquidity(
        uint256 amount,
        uint256[POOL_ASSETS] memory minTokenAmounts,
        bool removeAll
    ) internal virtual override {
        if (removeAll) {
            cvxRewards.withdrawAllAndUnwrap(true);
        } else {
            cvxRewards.withdrawAndUnwrap(amount, false);
        }

        super.removeLiquidity(amount, minTokenAmounts, removeAll);
    }

    function claimCollectedRewards() internal virtual override {
        cvxRewards.getReward();
    }
}
