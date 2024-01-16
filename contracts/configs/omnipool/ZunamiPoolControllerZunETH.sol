//SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import '../../ZunamiPoolThroughRedemptionFeeController.sol';

contract ZunamiPoolControllerZunETH is ZunamiPoolThroughRedemptionFeeController {
    constructor(address pool) ZunamiPoolThroughRedemptionFeeController(pool) {}
}
