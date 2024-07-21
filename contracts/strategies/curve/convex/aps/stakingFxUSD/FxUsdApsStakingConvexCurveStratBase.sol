//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../../../utils/Constants.sol';
import '../../../../../interfaces/IController.sol';
import '../../../../../interfaces/ITokenConverter.sol';
import '../../FxConvexCurveNStratBase.sol';
import '../../../../../interfaces/ICurvePool2.sol';
import '../../../../../interfaces/ITokenConverter.sol';

contract FxUsdApsStakingConvexCurveStratBase is FxConvexCurveNStratBase {
    using SafeERC20 for IERC20;

    error InsufficientAmount();

    uint256 constant ZUNAMI_STABLE_TOKEN_ID = 0;

    uint128 public constant FXUSD_TOKEN_POOL_FXUSD_ID = 1;
    int128 public constant FXUSD_TOKEN_POOL_FXUSD_ID_INT = int128(FXUSD_TOKEN_POOL_FXUSD_ID);

    uint128 public constant FXUSD_TOKEN_POOL_TOKEN_ID = 0;
    int128 public constant FXUSD_TOKEN_POOL_TOKEN_ID_INT = int128(FXUSD_TOKEN_POOL_TOKEN_ID);

    IController public immutable zunamiController;
    IERC20 public immutable zunamiStable;

    ITokenConverter public converter;
    event SetTokenConverter(address tokenConverter);

    constructor(
        IERC20[POOL_ASSETS] memory _tokens,
        uint256[POOL_ASSETS] memory _tokenDecimalsMultipliers,
        address _poolAddr,
        address _poolLpAddr,
        address _cvxBooster,
        uint256 _cvxPID,
        address _zunamiControllerAddr,
        address _zunamiStableAddr
    )
        FxConvexCurveNStratBase(
            _tokens,
            _tokenDecimalsMultipliers,
            _poolAddr,
            _poolLpAddr,
            _cvxBooster,
            _cvxPID
        )
    {
        if (_zunamiControllerAddr == address(0)) revert ZeroAddress();
        zunamiController = IController(_zunamiControllerAddr);

        if (_zunamiStableAddr == address(0)) revert ZeroAddress();
        zunamiStable = IERC20(_zunamiStableAddr);
    }

    function setTokenConverter(address converterAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (address(converterAddr) == address(0)) revert ZeroAddress();
        converter = ITokenConverter(converterAddr);
        emit SetTokenConverter(converterAddr);
    }

    function convertCurvePoolTokenAmounts(
        uint256[POOL_ASSETS] memory amounts
    ) internal pure override returns (uint256[] memory) {
        uint256[] memory amountsN = new uint256[](CURVENG_MAX_COINS);
        amountsN[FXUSD_TOKEN_POOL_TOKEN_ID] = amounts[ZUNAMI_STABLE_TOKEN_ID];
        return amountsN;
    }

    function convertAndApproveTokens(
        address pool,
        uint256[POOL_ASSETS] memory amounts
    ) internal override returns (uint256[] memory) {
        uint256[] memory amountsN = new uint256[](CURVENG_MAX_COINS);
        amountsN[FXUSD_TOKEN_POOL_TOKEN_ID] = amounts[ZUNAMI_STABLE_TOKEN_ID];
        zunamiStable.safeIncreaseAllowance(pool, amountsN[FXUSD_TOKEN_POOL_TOKEN_ID]);
        return amountsN;
    }

    function getCurveRemovingTokenIndex() internal pure override returns (int128) {
        return FXUSD_TOKEN_POOL_TOKEN_ID_INT;
    }

    function getZunamiRemovingTokenIndex() internal pure override returns (uint256) {
        return ZUNAMI_STABLE_TOKEN_ID;
    }
}
