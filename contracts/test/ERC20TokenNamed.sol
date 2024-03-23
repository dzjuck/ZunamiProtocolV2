//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract ERC20TokenNamed is ERC20 {
    uint8 private immutable _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        _decimals = decimals_ == 0 ? 18 : decimals_;
        _mint(msg.sender, 100_000_000 * (10 ** decimals_));
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
