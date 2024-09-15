//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../ZunamiPoolCompoundController.sol';

contract ZunamiPoolControllerApsZunBTC is ZunamiPoolCompoundController {
    constructor(
        address pool
    ) ZunamiPoolCompoundController(pool, 'Zunami BTC APS LP', 'apsZunBTCLP') {}
}
