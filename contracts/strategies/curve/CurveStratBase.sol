//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import '../../interfaces/ICurvePool2.sol';
import '../ZunamiStratBase.sol';
import { IOracle } from '../../lib/ConicOracle/interfaces/IOracle.sol';

abstract contract CurveStratBase is ZunamiStratBase {
    using SafeERC20 for IERC20Metadata;

    ICurvePool2 public immutable pool;
    IERC20Metadata public immutable poolToken;
    IOracle public immutable oracle;

    constructor(address poolAddr, address poolTokenAddr, address oracleAddr) ZunamiStratBase() {
        pool = ICurvePool2(poolAddr);
        poolToken = IERC20Metadata(poolTokenAddr);
        oracle = IOracle(oracleAddr);
    }

    function convertCurvePoolTokenAmounts(
        uint256[POOL_ASSETS] memory amounts
    ) internal view virtual returns (uint256[2] memory);

    function checkDepositSuccessful(
        uint256[POOL_ASSETS] memory amounts
    ) internal view override returns (bool) {
        uint256[POOL_ASSETS] memory tokenDecimals = zunamiPool.tokenDecimalsMultipliers();

        uint256 amountsTotal;
        for (uint256 i = 0; i < 5; i++) {
            amountsTotal += amounts[i] * tokenDecimals[i];
        }

        uint256 amountsMin = (amountsTotal * minDepositAmount) / DEPOSIT_DENOMINATOR;

        uint256 depositedLp = pool.calc_token_amount(convertCurvePoolTokenAmounts(amounts), true);

        return (depositedLp * getLiquidityTokenPrice()) / PRICE_DENOMINATOR >= amountsMin;
    }

    function depositLiquidityPool(
        uint256[POOL_ASSETS] memory amounts
    ) internal override returns (uint256 poolTokenAmount) {
        uint256[2] memory amounts2 = convertAndApproveTokens(address(pool), amounts);
        poolTokenAmount = pool.add_liquidity(amounts2, 0);

        depositLiquidity(poolTokenAmount);
    }

    function depositLiquidity(uint256 amount) internal virtual;

    function convertAndApproveTokens(
        address pool,
        uint256[POOL_ASSETS] memory amounts
    ) internal virtual returns (uint256[2] memory amounts2);

    function getLiquidityTokenPrice() internal view override returns (uint256) {
        return oracle.getUSDPrice(address(poolToken));
    }

    function calcTokenAmount(
        uint256[POOL_ASSETS] memory tokenAmounts,
        bool isDeposit
    ) public view override returns (uint256 sharesAmount) {
        return pool.calc_token_amount(convertCurvePoolTokenAmounts(tokenAmounts), isDeposit);
    }

    function calcRemovingLPTokenAmount(
        uint256 poolTokenRatio, // multiplied by 1e18
        uint256[POOL_ASSETS] memory minTokenAmounts
    ) internal view override returns (bool success, uint256 removingLPTokenAmount) {
        removingLPTokenAmount = (getLiquidityBalance() * poolTokenRatio) / RATIO_MULTIPLIER;
        success = removingLPTokenAmount >= calcTokenAmount(minTokenAmounts, false);
    }

    function getCurveRemovingTokenIndex() internal pure virtual returns (int128);

    function removeLiquidity(
        uint256 amount,
        uint256[POOL_ASSETS] memory minTokenAmounts
    ) internal virtual override {
        int128 curveTokenIndex = getCurveRemovingTokenIndex();
        pool.remove_liquidity_one_coin(
            amount,
            curveTokenIndex,
            convertCurvePoolTokenAmounts(minTokenAmounts)[uint256(int256(curveTokenIndex))]
        );
    }

    function removeAllLiquidity() internal virtual override {
        int128 curveTokenIndex = getCurveRemovingTokenIndex();
        pool.remove_liquidity_one_coin(poolToken.balanceOf(address(this)), curveTokenIndex, 0);
    }
}
