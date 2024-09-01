//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../ZunamiPool.sol';
import '../../../utils/BaseConstants.sol';

contract ZunamiPoolBaseApsZunUSD is ZunamiPool {
    constructor() ZunamiPool('Zunami USD APS', 'apsZunUSD') {
        address[POOL_ASSETS] memory tokens;
        tokens[0] = BaseConstants.ZUNUSD_ADDRESS;
        tokens[1] = BaseConstants.ZUNUSD_NATIVE_ADDRESS;

        uint256[POOL_ASSETS] memory tokenDecimalMultipliers;
        tokenDecimalMultipliers[0] = 1;
        tokenDecimalMultipliers[1] = 1;

        _setTokens(tokens, tokenDecimalMultipliers);
    }
}
