// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import '../../interfaces/IOracle.sol';
import '../../libraries/ScaledMath.sol';

interface ICurvePriceOracleNG {
    function price_oracle(uint256 i) external view returns (uint256);
}

contract ZunUsdOracle is IOracle {
    using ScaledMath for uint256;

    // Tokens
    address internal constant _CRVUSD = address(0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E);
    address internal constant _ZUNUSD = address(0x8C0D76C9B18779665475F3E212D9Ca1Ed6A1A0e6);

    // Curve pools
    address internal constant _CRVUSD_ZUNUSD = address(0x8C24b3213FD851db80245FCCc42c40B94Ac9a745);

    IOracle internal immutable _genericOracle;

    constructor(address genericOracle_) {
        _genericOracle = IOracle(genericOracle_);
    }

    function getUSDPrice(address token_) external view override returns (uint256) {
        require(isTokenSupported(token_), 'token not supported');
        return _getZunUSDPriceForCurvePool(_CRVUSD_ZUNUSD, _CRVUSD);
    }

    function isTokenSupported(address token_) public pure override returns (bool) {
        return token_ == _ZUNUSD;
    }

    function _getZunUSDPriceForCurvePool(
        address curvePool_,
        address token_
    ) internal view returns (uint256) {
        uint256 tokenPrice_ = _genericOracle.getUSDPrice(token_);
        uint256 tokenPerZunUSD_ = ICurvePriceOracleNG(curvePool_).price_oracle(0);

        return tokenPrice_.mulDown(tokenPerZunUSD_);
    }
}
