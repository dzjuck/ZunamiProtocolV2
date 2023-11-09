//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '../../ZunamiPoolThroughController.sol';

contract ZunamiPooControllerZunETH is ZunamiPoolThroughController {
    constructor(address pool) ZunamiPoolThroughController(pool) {}
}
