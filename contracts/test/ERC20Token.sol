//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract ERC20Token is ERC20 {

    uint8 immutable private _decimals;

    constructor(uint8 decimals) ERC20('MyToken', 'MTK') {
        _decimals = decimals == 0 ? 18 : decimals;
        _mint(msg.sender, 100_000_000 * (10 ** decimals));
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
