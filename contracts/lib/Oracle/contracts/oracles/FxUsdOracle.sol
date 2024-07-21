// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import '../../interfaces/IOracle.sol';
import '../../interfaces/ICurvePriceOracleNG.sol';
import '../../libraries/ScaledMath.sol';

contract FxUsdOracle is IOracle {
    using ScaledMath for uint256;


    // Tokens
    address internal constant _FXUSD = address(0x085780639CC2cACd35E474e71f4d000e2405d8f6);
    address internal constant _GHO = address(0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f);
    address internal constant _FRAX = address(0x853d955aCEf822Db058eb8505911ED77F175b99e);

    // Curve pools
    address internal constant _GHO_FXUSD = address(0x74345504Eaea3D9408fC69Ae7EB2d14095643c5b);
    address internal constant _FRAX_FXUSD = address(0x1EE81c56e42EC34039D993d12410d437DdeA341E);

    IOracle internal immutable _genericOracle;

    constructor(address genericOracle_) {
        if (genericOracle_ == address(0)) revert ZeroAddress();
        _genericOracle = IOracle(genericOracle_);
    }

    function getUSDPrice(address token_) external view override returns (uint256) {
        if (!isTokenSupported(token_)) revert UnsupportedToken();
        uint256 priceFromGho_ = _getFxUsdPriceForCurvePool(_GHO_FXUSD, _GHO);
        uint256 priceFromFrax_ = _getFxUsdPriceForCurvePool(_FRAX_FXUSD, _FRAX);
        return _median(priceFromGho_, priceFromFrax_);
    }

    function isTokenSupported(address token_) public pure override returns (bool) {
        return token_ == _FXUSD;
    }

    function _getFxUsdPriceForCurvePool(
        address curvePool_,
        address token_
    ) internal view returns (uint256) {
        uint256 tokenPrice_ = _genericOracle.getUSDPrice(token_);
        uint256 tokenPerStable_ = ICurvePriceOracleNG(curvePool_).price_oracle(0);
        return tokenPrice_.divDown(tokenPerStable_);
    }

    function _median(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a + b) / 2;
    }
}
