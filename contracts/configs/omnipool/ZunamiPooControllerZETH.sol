//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '../../ZunamiPoolThroughController.sol';

contract ZunamiPooControllerZETH is ZunamiPoolThroughController {
    constructor(address pool) ZunamiPoolThroughController(pool) {}
}
