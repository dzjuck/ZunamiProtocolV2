//SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import '@openzeppelin/contracts/access/AccessControl.sol';

contract AccessControl2RolesValuation is AccessControl {
    error UnauthorizedAccount2Roles(address account, bytes32[2] roles);

    modifier only2Roles(bytes32[2] memory roles) {
        _check2Roles(roles, _msgSender());
        _;
    }

    function _check2Roles(bytes32[2] memory roles, address account) internal view virtual {
        if (!hasRole(roles[0], account) && !hasRole(roles[1], account)) {
            revert UnauthorizedAccount2Roles(account, roles);
        }
    }
}
