//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/interfaces/IERC4626.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import '../ZunamiStratBase.sol';

abstract contract ERC4626StratBase is ZunamiStratBase {
    using SafeERC20 for IERC20;

    IERC4626 public immutable vault;
    IERC20 public immutable vaultAsset;

    uint256 public depositedAssets;

    uint256 internal constant SHARES = 1e18;

    constructor(
        IERC20[POOL_ASSETS] memory tokens_,
        uint256[POOL_ASSETS] memory tokenDecimalsMultipliers_,
        address vaultAddr,
        address vaultAssetAddr
    ) ZunamiStratBase(tokens_, tokenDecimalsMultipliers_) {
        if (address(vaultAddr) == address(0)) revert ZeroAddress();
        if (address(vaultAssetAddr) == address(0)) revert ZeroAddress();
        vault = IERC4626(vaultAddr);
        vaultAsset = IERC20(vaultAssetAddr);
    }

    function getLiquidityBalance() internal view override returns (uint256) {
        return super.getLiquidityBalance() - calculateCollectedRewards();
    }

    function getLiquidityTokenPrice() internal view virtual override returns (uint256) {
        return (oracle.getUSDPrice(address(vaultAsset)) * vault.convertToAssets(SHARES)) / SHARES;
    }

    function convertVaultAssetAmounts(
        uint256[POOL_ASSETS] memory amounts
    ) internal view virtual returns (uint256 amount);

    function depositLiquidity(
        uint256[POOL_ASSETS] memory amounts
    ) internal virtual override returns (uint256) {
        uint256 amount = convertAndApproveTokens(address(vault), amounts);
        depositedAssets += amount;

        return vault.deposit(amount, address(this));
    }

    function convertAndApproveTokens(
        address vault,
        uint256[POOL_ASSETS] memory amounts
    ) internal virtual returns (uint256 amount);

    function calcTokenAmount(
        uint256[POOL_ASSETS] memory tokenAmounts,
        bool
    ) public view override returns (uint256 sharesAmount) {
        return vault.convertToShares(convertVaultAssetAmounts(tokenAmounts));
    }

    function removeLiquidity(
        uint256 amount,
        uint256[POOL_ASSETS] memory,
        bool
    ) internal virtual override {
        uint256 assets = vault.redeem(amount, address(this), address(this));
        if(depositedAssets > assets) {
            depositedAssets -= assets;
        } else {
            depositedAssets = 0;
        }
    }

    function calculateCollectedRewards() internal view returns (uint256 rewardShares) {
        uint256 redeemableAssets = vault.previewRedeem(depositedLiquidity);
        if (redeemableAssets > depositedAssets) {
            uint256 rewardAssets = redeemableAssets - depositedAssets;
            rewardShares = vault.convertToShares(rewardAssets);
        }
    }

    function claimCollectedRewards() internal virtual override {
        uint256 rewardShares = calculateCollectedRewards();
        if (rewardShares > 0) {
            uint256[POOL_ASSETS] memory minTokenAmounts;
            removeLiquidity(rewardShares, minTokenAmounts, false);
            depositedLiquidity -= rewardShares;
        }
    }
}
