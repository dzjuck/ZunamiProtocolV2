//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract ERC20Token is ERC20 {
    constructor() ERC20('MyToken', 'MTK') {
        _mint(msg.sender, 100_000_000 * 1e18);
    }
}
