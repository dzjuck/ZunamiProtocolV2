// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SelfDestruct {
    constructor() payable {}

    function transferBalance(address to) public {
        selfdestruct(payable(to));
    }
}
