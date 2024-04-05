// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import '../../interfaces/IOracle.sol';
import '../../libraries/ScaledMath.sol';

interface ICurvePriceOracleNG {
    function price_oracle(uint256 i) external view returns (uint256);
}

contract SdtOracle is IOracle {
    using ScaledMath for uint256;

    // Tokens
    address internal constant _SDT = address(0x73968b9a57c6E53d41345FD57a6E6ae27d6CDB2F);
    // Curve pools
    address internal constant _crvUSD_frxETH_SDT_POOL =
        address(0x954313005C56b555bdC41B84D6c63B69049d7847);

    IOracle internal immutable _genericOracle;

    constructor(address genericOracle_) {
        _genericOracle = IOracle(genericOracle_);
    }

    function getUSDPrice(address token_) external view override returns (uint256) {
        require(isTokenSupported(token_), 'token not supported');
        return ICurvePriceOracleNG(_crvUSD_frxETH_SDT_POOL).price_oracle(1);
    }

    function isTokenSupported(address token_) public pure override returns (bool) {
        return token_ == _SDT;
    }
}
