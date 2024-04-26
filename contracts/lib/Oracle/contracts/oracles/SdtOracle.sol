// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import '../../interfaces/IOracle.sol';
import '../../libraries/ScaledMath.sol';
import '../../interfaces/ICurvePriceOracleNG.sol';


contract SdtOracle is IOracle {
    using ScaledMath for uint256;

    // Tokens
    address internal constant _SDT = address(0x73968b9a57c6E53d41345FD57a6E6ae27d6CDB2F);
    address internal constant _CRVUSD = address(0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E);
    // Curve pools
    address internal constant _crvUSD_frxETH_SDT_POOL =
        address(0x954313005C56b555bdC41B84D6c63B69049d7847);

    uint256 internal constant SDT_IDNEX = 1;

    IOracle internal immutable _genericOracle;

    constructor(address genericOracle_) {
        if (genericOracle_ == address(0)) revert ZeroAddress();
        _genericOracle = IOracle(genericOracle_);
    }

    function getUSDPrice(address token_) external view override returns (uint256) {
        if (!isTokenSupported(token_)) revert UnsupportedToken();
        return _getSDTPriceForCurvePool(_crvUSD_frxETH_SDT_POOL, _CRVUSD);
    }

    function isTokenSupported(address token_) public pure override returns (bool) {
        return token_ == _SDT;
    }

    function _getSDTPriceForCurvePool(
        address curvePool_,
        address token_
    ) internal view returns (uint256) {
        uint256 tokenPrice_ = _genericOracle.getUSDPrice(token_);
        uint256 tokenPerSDT_ = ICurvePriceOracleNG(curvePool_).price_oracle(SDT_IDNEX);

        return tokenPrice_.mulDown(tokenPerSDT_);
    }
}
