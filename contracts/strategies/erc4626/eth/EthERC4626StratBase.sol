//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import '../../../utils/Constants.sol';
import '../../../interfaces/ITokenConverter.sol';
import '../ERC4626StratBase.sol';

contract EthERC4626StratBase is ERC4626StratBase {
    using SafeERC20 for IERC20;

    uint256 public constant ZUNAMI_WETH_TOKEN_ID = 0;
    uint256 public constant ZUNAMI_FRXETH_TOKEN_ID = 1;

    ITokenConverter public converter;

    event SetTokenConverter(address converter);

    constructor(
        IERC20[POOL_ASSETS] memory tokens_,
        uint256[POOL_ASSETS] memory tokenDecimalsMultipliers_,
        address vaultAddr,
        address vaultAssetAddr
    ) ERC4626StratBase(tokens_, tokenDecimalsMultipliers_, vaultAddr, vaultAssetAddr) {}

    function setTokenConverter(address tokenConverterAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (address(tokenConverterAddr) == address(0)) revert ZeroAddress();
        converter = ITokenConverter(tokenConverterAddr);
        emit SetTokenConverter(tokenConverterAddr);
    }

    function getTokenPrice(address token) internal view override returns (uint256) {
        if (token == address(Constants.WETH_ADDRESS)) return 1e18;
        return
            (oracle.getUSDPrice(token) * PRICE_DENOMINATOR) /
            oracle.getUSDPrice(Constants.CHAINLINK_FEED_REGISTRY_ETH_ADDRESS);
    }

    function getLiquidityTokenPrice() internal view override returns (uint256) {
        return
            (oracle.getUSDPrice(address(vaultAsset)) * vault.convertToAssets(1e18)) /
            oracle.getUSDPrice(Constants.CHAINLINK_FEED_REGISTRY_ETH_ADDRESS);
    }

    function convertVaultAssetAmounts(
        uint256[POOL_ASSETS] memory amounts
    ) internal view override returns (uint256 amount) {
        return
            amounts[ZUNAMI_FRXETH_TOKEN_ID] +
            converter.valuate(
                address(tokens[ZUNAMI_WETH_TOKEN_ID]),
                address(tokens[ZUNAMI_FRXETH_TOKEN_ID]),
                amounts[ZUNAMI_WETH_TOKEN_ID]
            );
    }

    function convertAndApproveTokens(
        address vault,
        uint256[POOL_ASSETS] memory amounts
    ) internal override returns (uint256 amount) {
        amount = amounts[ZUNAMI_FRXETH_TOKEN_ID];
        uint256 wethBalance = amounts[ZUNAMI_WETH_TOKEN_ID];
        if (wethBalance > 0) {
            IERC20(tokens[ZUNAMI_WETH_TOKEN_ID]).safeTransfer(address(converter), wethBalance);
            amount += converter.handle(
                address(tokens[ZUNAMI_WETH_TOKEN_ID]),
                address(tokens[ZUNAMI_FRXETH_TOKEN_ID]),
                wethBalance,
                applySlippage(wethBalance)
            );
        }

        tokens[ZUNAMI_FRXETH_TOKEN_ID].safeIncreaseAllowance(address(vault), amount);
    }
}
