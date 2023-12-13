//SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import '../../ZunamiPool.sol';
import '../../utils/Constants.sol';

contract ZunamiPoolApsZunUSD is ZunamiPool {
    constructor() ZunamiPool('Zunami USD APS', 'apsZunUSD') {
        address[] memory tokens = new address[](1);
        tokens[0] = Constants.zunUSD_ADDRESS;

        uint256[] memory tokenDecimalMultipliers = new uint256[](1);
        tokenDecimalMultipliers[0] = 1;

        _setTokens(tokens, tokenDecimalMultipliers);
    }
}
