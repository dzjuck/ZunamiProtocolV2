//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '../../ZunamiPoolThroughRedemptionFeeController.sol';

contract ZunamiPooControllerZunUSD is ZunamiPoolThroughRedemptionFeeController {
    constructor(address pool) ZunamiPoolThroughRedemptionFeeController(pool) {}
}
