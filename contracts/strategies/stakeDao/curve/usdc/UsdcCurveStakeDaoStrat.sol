//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import "../CurveStakeDaoStratBase.sol";
import "../../../../interfaces/IStableConverter.sol";

//import "hardhat/console.sol";

contract UsdcCurveStakeDaoStrat is CurveStakeDaoStratBase {
    using SafeERC20 for IERC20Metadata;

    uint256 public constant ZUNAMI_DAI_TOKEN_ID = 0;
    uint256 public constant ZUNAMI_USDC_TOKEN_ID = 1;
    uint256 public constant ZUNAMI_USDT_TOKEN_ID = 2;

    uint128 public constant CURVE_POOL_USDC_ID = 0;
    int128 public constant CURVE_POOL_USDC_ID_INT = int128(CURVE_POOL_USDC_ID);

    IStableConverter public stableConverter;

    event SetStableConverter(address stableConverter);

    constructor(
        address vaultAddr,
        address poolAddr,
        address poolLpAddr
    ) CurveStakeDaoStratBase(vaultAddr, poolAddr, poolLpAddr) {}

    function setStableConverter(address stableConverterAddr) external onlyOwner {
        stableConverter = IStableConverter(stableConverterAddr);
        emit SetStableConverter(stableConverterAddr);
    }

    function convertLiquidityTokenAmount(uint256[5] memory amounts) internal view override returns(uint256[2] memory) {
        return calcPoolUsdcAmounts(amounts);
    }

    function convertAndApproveTokens(
        address pool,
        uint256[5] memory amounts
    ) internal override returns(uint256[2] memory amounts2) {
        IERC20Metadata usdt = zunami.tokens()[ZUNAMI_USDC_TOKEN_ID];

        convertZunamiStableToUsdc(ZUNAMI_DAI_TOKEN_ID, amounts[ZUNAMI_DAI_TOKEN_ID]);
        convertZunamiStableToUsdc(ZUNAMI_USDT_TOKEN_ID, amounts[ZUNAMI_USDT_TOKEN_ID]);

        amounts2[CURVE_POOL_USDC_ID] = usdt.balanceOf(address(this));
        usdt.safeIncreaseAllowance(address(pool), amounts2[CURVE_POOL_USDC_ID]);
    }

    function getCurveRemovingTokenIndex() internal pure override returns(int128) {
        return CURVE_POOL_USDC_ID_INT;
    }

    function calcPoolUsdcAmounts(uint256[5] memory amounts) internal view returns(uint256[2] memory amounts2) {
        if(
            amounts[ZUNAMI_USDT_TOKEN_ID] == 0 &&
            amounts[ZUNAMI_USDC_TOKEN_ID] == 0 &&
            amounts[ZUNAMI_DAI_TOKEN_ID] == 0
        ) return [uint256(0),0];

        amounts2[CURVE_POOL_USDC_ID] =
            amounts[ZUNAMI_USDC_TOKEN_ID] +
            stableConverter.valuate(
                address(zunami.tokens()[ZUNAMI_USDT_TOKEN_ID]),
                address(zunami.tokens()[ZUNAMI_USDC_TOKEN_ID]),
                amounts[ZUNAMI_USDT_TOKEN_ID]
            ) +
            stableConverter.valuate(
                address(zunami.tokens()[ZUNAMI_DAI_TOKEN_ID]),
                address(zunami.tokens()[ZUNAMI_USDC_TOKEN_ID]),
                amounts[ZUNAMI_DAI_TOKEN_ID]
            );
    }

    function convertZunamiStableToUsdc(uint256 zunamiTokenIndex, uint256 tokenAmount) internal {
        convertStables(zunamiTokenIndex, ZUNAMI_USDC_TOKEN_ID, tokenAmount);
    }

    function convertStables(uint256 fromZunamiIndex, uint256 toZunamiIndex, uint256 fromAmount) internal {
        IERC20Metadata fromToken = zunami.tokens()[fromZunamiIndex];
        fromToken.safeTransfer(address(stableConverter), fromAmount);

        stableConverter.handle(
            address(fromToken),
            address(zunami.tokens()[toZunamiIndex]),
            fromAmount,
            0
        );
    }
}
