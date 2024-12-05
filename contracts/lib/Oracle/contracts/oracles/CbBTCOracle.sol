// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import '../../interfaces/IOracle.sol';
import '../../interfaces/ICurvePriceOracleNG.sol';
import '../../libraries/ScaledMath.sol';

contract CbBTCOracle is IOracle {
    using ScaledMath for uint256;

    // Tokens
    address internal constant _WBTC = address(0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599);
    address internal constant _CBBTC = address(0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf);

    // Curve pools
    address internal constant _CBBTC_WBTC = address(0x839d6bDeDFF886404A6d7a788ef241e4e28F4802);

    IOracle internal immutable _genericOracle;

    constructor(address genericOracle_) {
        if (genericOracle_ == address(0)) revert ZeroAddress();
        _genericOracle = IOracle(genericOracle_);
    }

    function getUSDPrice(address token_) external view override returns (uint256) {
        if (!isTokenSupported(token_)) revert UnsupportedToken();
        return _getCbBTCPriceForCurvePool(_CBBTC_WBTC, _WBTC);
    }

    function isTokenSupported(address token_) public pure override returns (bool) {
        return token_ == _CBBTC;
    }

    function _getCbBTCPriceForCurvePool(
        address curvePool_,
        address token_
    ) internal view returns (uint256) {
        uint256 tokenPrice_ = _genericOracle.getUSDPrice(token_);
        uint256 cbBtcPerToken = ICurvePriceOracleNG(curvePool_).price_oracle(0);

        return cbBtcPerToken.mulDown(tokenPrice_);
    }
}
