//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../ZunamiPool.sol';
import '../../utils/Constants.sol';

contract ZunamiPoolZunBTC is ZunamiPool {
    uint256 public constant ZUNAMI_WBTC_TOKEN_ID = 0;
    uint256 public constant ZUNAMI_TBTC_TOKEN_ID = 1;

    constructor() ZunamiPool('Zunami BTC', 'zunBTC') {
        address[POOL_ASSETS] memory tokens;
        tokens[ZUNAMI_WBTC_TOKEN_ID] = Constants.WBTC_ADDRESS;
        tokens[ZUNAMI_TBTC_TOKEN_ID] = Constants.TBTC_ADDRESS;

        uint256[POOL_ASSETS] memory tokenDecimalMultipliers;
        tokenDecimalMultipliers[ZUNAMI_WBTC_TOKEN_ID] = 1e10;
        tokenDecimalMultipliers[ZUNAMI_TBTC_TOKEN_ID] = 1;

        _setTokens(tokens, tokenDecimalMultipliers);
    }
}
