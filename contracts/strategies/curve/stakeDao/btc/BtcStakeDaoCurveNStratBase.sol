//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../../utils/Constants.sol';
import '../../../../interfaces/ITokenConverter.sol';
import '../../../../interfaces/ICurvePool2Native.sol';
import '../../../../interfaces/IWETH.sol';
import '../StakeDaoCurveNStratBase.sol';

contract BtcStakeDaoCurveNStratBase is StakeDaoCurveNStratBase {
    using SafeERC20 for IERC20;

    uint256 public constant ZUNAMI_WBTC_TOKEN_ID = 0;
    uint256 public constant ZUNAMI_TBTC_TOKEN_ID = 1;

    uint128 public constant CURVE_POOL_WBTC_ID = 1;
    int128 public constant CURVE_POOL_WBTC_ID_INT = int128(CURVE_POOL_WBTC_ID);

    IERC20 public constant wBtc = IERC20(Constants.WBTC_ADDRESS);
    IERC20 public constant tBtc = IERC20(Constants.TBTC_ADDRESS);

    ITokenConverter public converter;

    event SetTokenConverter(address converter);

    constructor(
        IERC20[POOL_ASSETS] memory _tokens,
        uint256[POOL_ASSETS] memory _tokenDecimalsMultipliers,
        address _vaultAddr,
        address _poolAddr,
        address _poolTokenAddr
    )
        StakeDaoCurveNStratBase(
            _tokens,
            _tokenDecimalsMultipliers,
            _vaultAddr,
            _poolAddr,
            _poolTokenAddr
        )
    {}

    function setTokenConverter(address tokenConverterAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (address(tokenConverterAddr) == address(0)) revert ZeroAddress();
        converter = ITokenConverter(tokenConverterAddr);
        emit SetTokenConverter(tokenConverterAddr);
    }

    function getTokenPrice(address token) internal view override returns (uint256) {
        return
            (oracle.getUSDPrice(token) * 1e18) /
            oracle.getUSDPrice(Constants.CHAINLINK_FEED_REGISTRY_BTC_ADDRESS);
    }

    function convertCurvePoolTokenAmounts(
        uint256[POOL_ASSETS] memory amounts
    ) internal view override returns (uint256[] memory) {

        uint256[] memory amountsN = new uint256[](CURVENG_MAX_COINS);
        if (amounts[CURVE_POOL_WBTC_ID] == 0 && amounts[ZUNAMI_TBTC_TOKEN_ID] == 0)
            return amountsN;

        amountsN[CURVE_POOL_WBTC_ID] = amounts[ZUNAMI_WBTC_TOKEN_ID] +
            converter.valuate(
                Constants.TBTC_ADDRESS,
                Constants.WBTC_ADDRESS,
                amounts[ZUNAMI_TBTC_TOKEN_ID]
            );
        return amountsN;
    }

    function convertAndApproveTokens(
        address,
        uint256[POOL_ASSETS] memory amounts
    ) internal override returns (uint256[] memory) {
        uint256[] memory amountsN = new uint256[](CURVENG_MAX_COINS);
        amountsN[CURVE_POOL_WBTC_ID] = amounts[ZUNAMI_WBTC_TOKEN_ID];

        if (amounts[ZUNAMI_TBTC_TOKEN_ID] > 0) {
            tBtc.safeTransfer(address(converter), amounts[ZUNAMI_TBTC_TOKEN_ID]);

            amountsN[CURVE_POOL_WBTC_ID] +=
                converter.handle(
                    Constants.TBTC_ADDRESS,
                    Constants.WBTC_ADDRESS,
                    amounts[ZUNAMI_TBTC_TOKEN_ID],
                    applySlippageDifferentPrice(
                        amounts[ZUNAMI_TBTC_TOKEN_ID],
                        Constants.TBTC_ADDRESS,
                        Constants.WBTC_ADDRESS
                    ) / tokenDecimalsMultipliers[ZUNAMI_WBTC_TOKEN_ID]
                );
        }

        wBtc.safeIncreaseAllowance(address(pool), amountsN[CURVE_POOL_WBTC_ID]);
        return amountsN;
    }

    function getCurveRemovingTokenIndex() internal pure override returns (int128) {
        return CURVE_POOL_WBTC_ID_INT;
    }

    function getZunamiRemovingTokenIndex() internal pure override returns (uint256) {
        return ZUNAMI_WBTC_TOKEN_ID;
    }
}
