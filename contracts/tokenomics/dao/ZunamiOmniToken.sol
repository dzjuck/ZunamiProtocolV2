//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol';
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ZunamiOmniToken is AccessControl, ERC20, ERC20Permit, ERC20Burnable  {

    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
    bytes32 public constant BURNER_ROLE = keccak256('BURNER_ROLE');

    constructor() ERC20('Zunami Token', 'ZUN') ERC20Permit('Zunami Token') {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address account, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(account, amount);
    }

    function burn(uint256 value) public override onlyRole(BURNER_ROLE) {
        super.burn(value);
    }
}
