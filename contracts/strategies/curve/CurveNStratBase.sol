//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import '../../interfaces/ICurvePoolN.sol';
import '../ZunamiStratBase.sol';

abstract contract CurveNStratBase is ZunamiStratBase {
    using SafeERC20 for IERC20;

    ICurvePoolN public immutable pool;
    IERC20 public immutable poolToken;

    constructor(
        IERC20[POOL_ASSETS] memory tokens_,
        uint256[POOL_ASSETS] memory tokenDecimalsMultipliers_,
        address poolAddr,
        address poolTokenAddr
    ) ZunamiStratBase(tokens_, tokenDecimalsMultipliers_) {
        if (poolAddr == address(0)) revert ZeroAddress();
        pool = ICurvePoolN(poolAddr);

        if (poolTokenAddr == address(0)) revert ZeroAddress();
        poolToken = IERC20(poolTokenAddr);
    }

    function convertCurvePoolTokenAmounts(
        uint256[POOL_ASSETS] memory amounts
    ) internal view virtual returns (uint256[] memory);

    function depositLiquidity(
        uint256[POOL_ASSETS] memory amounts
    ) internal override returns (uint256 poolTokenAmount) {
        uint256[] memory amountsN = convertAndApproveTokens(address(pool), amounts);
        poolTokenAmount = depositCurve(amountsN);
        depositBooster(poolTokenAmount);
    }

    function convertAndApproveTokens(
        address pool,
        uint256[POOL_ASSETS] memory amounts
    ) internal virtual returns (uint256[] memory amountsN);

    function depositCurve(uint256[] memory amountsN) internal virtual returns (uint256 deposited) {
        return pool.add_liquidity(amountsN, 0);
    }

    function depositBooster(uint256 amount) internal virtual;

    function getLiquidityTokenPrice() internal view virtual override returns (uint256) {
        return getTokenPrice(address(poolToken));
    }

    function calcTokenAmount(
        uint256[POOL_ASSETS] memory tokenAmounts,
        bool isDeposit
    ) public view override returns (uint256 sharesAmount) {
        return pool.calc_token_amount(convertCurvePoolTokenAmounts(tokenAmounts), isDeposit);
    }

    function getCurveRemovingTokenIndex() internal view virtual returns (int128);

    function getZunamiRemovingTokenIndex() internal view virtual returns (uint256);

    function removeLiquidity(
        uint256 amount,
        uint256[POOL_ASSETS] memory minTokenAmounts,
        bool
    ) internal virtual override {
        int128 curveTokenIndex = getCurveRemovingTokenIndex();
        uint256 removedAmount = pool.remove_liquidity_one_coin(
            amount,
            curveTokenIndex,
            minTokenAmounts[getZunamiRemovingTokenIndex()]
        );
        convertRemovedAmount(removedAmount);
    }

    function convertRemovedAmount(uint256 receivedAmount) internal virtual {}
}
