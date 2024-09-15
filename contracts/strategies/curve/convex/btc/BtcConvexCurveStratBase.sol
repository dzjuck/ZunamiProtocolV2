//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../../utils/Constants.sol';
import '../../../../interfaces/ITokenConverter.sol';
import '../../../../interfaces/ICurvePool2Native.sol';
import '../../../../interfaces/IWETH.sol';
import '../ConvexCurveStratBase.sol';

contract BtcConvexCurveStratBase is ConvexCurveStratBase {
    using SafeERC20 for IERC20;

    uint256 public constant ZUNAMI_WBTC_TOKEN_ID = 0;
    uint256 public constant ZUNAMI_TBTC_TOKEN_ID = 1;

    uint128 public constant CURVE_POOL_WBTC_ID = 0;
    int128 public constant CURVE_POOL_WBTC_ID_INT = int128(CURVE_POOL_WBTC_ID);

    uint128 public constant CURVE_POOL_TBTC_ID = 0;
    int128 public constant CURVE_POOL_TBTC_ID_INT = int128(CURVE_POOL_TBTC_ID);

    IERC20 wBtc = IERC20(Constants.WBTC_ADDRESS);
    IERC20 tBtc = IERC20(Constants.TBTC_ADDRESS);

    ITokenConverter public converter;

    event SetTokenConverter(address converter);

    constructor(
        IERC20[POOL_ASSETS] memory _tokens,
        uint256[POOL_ASSETS] memory _tokenDecimalsMultipliers,
        address _poolAddr,
        address _poolLpAddr,
        address _cvxBooster,
        address _cvxRewardsAddr,
        uint256 _cvxPID
    )
        ConvexCurveStratBase(
            _tokens,
            _tokenDecimalsMultipliers,
            _poolAddr,
            _poolLpAddr,
            _cvxBooster,
            _cvxRewardsAddr,
            _cvxPID
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
    ) internal view override returns (uint256[2] memory amounts2) {
        if (amounts[CURVE_POOL_WBTC_ID] == 0 && amounts[ZUNAMI_TBTC_TOKEN_ID] == 0)
            return [uint256(0), 0];

        return [amounts[ZUNAMI_TBTC_TOKEN_ID], amounts[ZUNAMI_TBTC_TOKEN_ID]];
    }

    function convertAndApproveTokens(
        address,
        uint256[POOL_ASSETS] memory amounts
    ) internal override returns (uint256[2] memory amounts2) {
        amounts2[CURVE_POOL_WBTC_ID] = amounts[ZUNAMI_WBTC_TOKEN_ID];
        amounts2[CURVE_POOL_TBTC_ID] = amounts[ZUNAMI_TBTC_TOKEN_ID];
        wBtc.safeIncreaseAllowance(address(pool), amounts2[CURVE_POOL_WBTC_ID]);
        tBtc.safeIncreaseAllowance(address(pool), amounts2[CURVE_POOL_TBTC_ID]);
    }

    function depositCurve(
        uint256[2] memory amounts2
    ) internal override returns (uint256 deposited) {
        return
            ICurvePool2(address(pool)).add_liquidity(
                amounts2,
                0
            );
    }

    function getCurveRemovingTokenIndex() internal pure override returns (int128) {
        return CURVE_POOL_WBTC_ID_INT;
    }

    function getZunamiRemovingTokenIndex() internal pure override returns (uint256) {
        return ZUNAMI_WBTC_TOKEN_ID;
    }
}
