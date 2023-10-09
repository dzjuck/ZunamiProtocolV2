//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ZunamiPool.sol";
import "../Constants.sol";

contract ZunamiPoolUZD is ZunamiPool {

    uint256 public constant ZUNAMI_DAI_TOKEN_ID = 0;
    uint256 public constant ZUNAMI_USDC_TOKEN_ID = 1;
    uint256 public constant ZUNAMI_USDT_TOKEN_ID = 2;

    constructor() ZunamiPool("Zunami USD", "UZD") {
        address[] memory tokens;
        tokens[ZUNAMI_DAI_TOKEN_ID] = Constants.DAI_ADDRESS;
        tokens[ZUNAMI_USDC_TOKEN_ID] = Constants.USDC_ADDRESS;
        tokens[ZUNAMI_USDT_TOKEN_ID] = Constants.USDT_ADDRESS;

        uint256[] memory tokenDecimalMultipliers;
        tokenDecimalMultipliers[ZUNAMI_DAI_TOKEN_ID] = 18;
        tokenDecimalMultipliers[ZUNAMI_USDC_TOKEN_ID] = 6;
        tokenDecimalMultipliers[ZUNAMI_USDT_TOKEN_ID] = 6;

        this.addTokens(tokens, tokenDecimalMultipliers); //TODO: check
    }
}
