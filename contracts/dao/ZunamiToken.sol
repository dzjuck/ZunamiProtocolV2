//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract ZunamiToken is ERC20, ERC20Permit {
    constructor() ERC20("Zunami Token", "ZUN") ERC20Permit("Zunami Token") {
        _mint(msg.sender, 100_000_000 * 10 ** decimals());
    }
}
