//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../../utils/Constants.sol';
import '../../../../interfaces/ITokenConverter.sol';
import '../../../../interfaces/ICurvePool2Native.sol';
import "../StakeDaoCurveNStratBase.sol";

contract EthStakeDaoCurveNStratBase is StakeDaoCurveNStratBase {
    using SafeERC20 for IERC20;

    uint256 public constant ZUNAMI_WETH_TOKEN_ID = 0;
    uint256 public constant ZUNAMI_FRXETH_TOKEN_ID = 1;

    uint128 public constant CURVE_POOL_WETH_ID = 0;
    int128 public constant CURVE_POOL_WETH_ID_INT = int128(CURVE_POOL_WETH_ID);

    ITokenConverter public converter;

    event SetTokenConverter(address converter);

    constructor(
        IERC20[POOL_ASSETS] memory _tokens,
        uint256[POOL_ASSETS] memory _tokenDecimalsMultipliers,
        address _vaultAddr,
        address _poolAddr,
        address _poolLpAddr
    )
        StakeDaoCurveNStratBase(
            _tokens,
            _tokenDecimalsMultipliers,
            _vaultAddr,
            _poolAddr,
            _poolLpAddr
        )
    {}

    function setTokenConverter(address tokenConverterAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (address(tokenConverterAddr) == address(0)) revert ZeroAddress();
        converter = ITokenConverter(tokenConverterAddr);
        emit SetTokenConverter(tokenConverterAddr);
    }

    function getTokenPrice(address token) internal view override returns (uint256) {
        if (token == address(Constants.WETH_ADDRESS)) return 1e18;
        return
            (oracle.getUSDPrice(token) * 1e18) /
            oracle.getUSDPrice(Constants.CHAINLINK_FEED_REGISTRY_ETH_ADDRESS);
    }

    function convertCurvePoolTokenAmounts(
        uint256[POOL_ASSETS] memory amounts
    ) internal view override returns (uint256[] memory) {

        uint256[] memory amountsN = new uint256[](CURVENG_MAX_COINS);

        if (amounts[ZUNAMI_WETH_TOKEN_ID] == 0 && amounts[ZUNAMI_FRXETH_TOKEN_ID] == 0)
            return amountsN;

        amountsN[ZUNAMI_WETH_TOKEN_ID] = amounts[ZUNAMI_WETH_TOKEN_ID] +
                            converter.valuate(
                address(tokens[ZUNAMI_FRXETH_TOKEN_ID]),
                address(tokens[ZUNAMI_WETH_TOKEN_ID]),
                amounts[ZUNAMI_FRXETH_TOKEN_ID]
            );

        return amountsN;
    }

    function convertAndApproveTokens(
        address pool,
        uint256[POOL_ASSETS] memory amounts
    ) internal override returns (uint256[] memory) {

        uint256[] memory amountsN = new uint256[](CURVENG_MAX_COINS);

        if (amounts[ZUNAMI_FRXETH_TOKEN_ID] > 0) {
            IERC20(tokens[ZUNAMI_FRXETH_TOKEN_ID]).safeTransfer(
                address(converter),
                amounts[ZUNAMI_FRXETH_TOKEN_ID]
            );
            amounts[ZUNAMI_WETH_TOKEN_ID] += converter.handle(
                address(tokens[ZUNAMI_FRXETH_TOKEN_ID]),
                address(tokens[ZUNAMI_WETH_TOKEN_ID]),
                amounts[ZUNAMI_FRXETH_TOKEN_ID],
                applySlippage(amounts[ZUNAMI_FRXETH_TOKEN_ID])
            );
        }

        amountsN[CURVE_POOL_WETH_ID] = amounts[ZUNAMI_WETH_TOKEN_ID];
        IERC20(Constants.WETH_ADDRESS).safeIncreaseAllowance(pool, amountsN[CURVE_POOL_WETH_ID]);

        return amountsN;
    }

    function getCurveRemovingTokenIndex() internal pure override returns (int128) {
        return CURVE_POOL_WETH_ID_INT;
    }

    function getZunamiRemovingTokenIndex() internal pure override returns (uint256) {
        return ZUNAMI_WETH_TOKEN_ID;
    }
}
