//SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import '../../ZunamiPoolCompoundController.sol';

contract ZunamiPooControllerApsZunUSD is ZunamiPoolCompoundController {
    constructor(
        address pool
    ) ZunamiPoolCompoundController(pool, 'Zunami USD APS LP', 'apsZunUSDLP') {}
}
