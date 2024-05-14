// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import '../../interfaces/IOracle.sol';
import '../../interfaces/ICurvePriceOracleNG.sol';
import '../../libraries/ScaledMath.sol';

contract PxETHOracle is IOracle {
    using ScaledMath for uint256;

    // Tokens
    address internal constant _PXETH = address(0x04C154b66CB340F3Ae24111CC767e0184Ed00Cc6);
    address internal constant _WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    address internal constant _FRXETH = address(0x5E8422345238F34275888049021821E8E08CAa1f);

    // Curve pools
    address internal constant _PXETH_WETH = address(0xC8Eb2Cf2f792F77AF0Cd9e203305a585E588179D);
    address internal constant _PXETH_FRXETH = address(0xe2Ed1dAc3A9547BC6057e32bf8133b5268D7d987);

    IOracle internal immutable _genericOracle;

    constructor(address genericOracle_) {
        if (genericOracle_ == address(0)) revert ZeroAddress();
        _genericOracle = IOracle(genericOracle_);
    }

    function getUSDPrice(address token_) external view override returns (uint256) {
        if (!isTokenSupported(token_)) revert UnsupportedToken();
        uint256 priceFromWEth_ = _getPxEthPriceForCurvePoolNG(_PXETH_WETH, _WETH);
        uint256 priceFromFrxETH_ = _getPxEthPriceForCurvePoolNG(_PXETH_FRXETH, _FRXETH);
        return _median(priceFromWEth_, priceFromFrxETH_);
    }

    function isTokenSupported(address token_) public pure override returns (bool) {
        return token_ == _PXETH;
    }

    function _getPxEthPriceForCurvePoolNG(
        address curvePool_,
        address token_
    ) internal view returns (uint256) {
        uint256 tokenPrice_ = _genericOracle.getUSDPrice(token_);
        uint256 tokenPerPxETH_ = ICurvePriceOracleNG(curvePool_).price_oracle(0);
        return tokenPrice_.mulDown(tokenPerPxETH_);
    }

    function _median(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a + b) / 2;
    }
}
