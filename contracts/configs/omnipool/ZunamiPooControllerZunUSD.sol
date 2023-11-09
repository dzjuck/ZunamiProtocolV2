//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '../../ZunamiPoolThroughController.sol';

contract ZunamiPooControllerZunUSD is ZunamiPoolThroughController {
    constructor(address pool) ZunamiPoolThroughController(pool) {}
}
