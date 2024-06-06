// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../../../interfaces/IGauge.sol';

contract TransferGauge is IGauge {
    using SafeERC20 for IERC20;

    address public immutable RECEIVER;
    IERC20 public immutable TOKEN;

    constructor(address _token, address _receiver) {
        require(_token != address(0), 'Zero token address');
        TOKEN = IERC20(_token);
        require(_receiver != address(0), 'Zero receiver address');
        RECEIVER = _receiver;
    }

    function distribute(uint256 amount) external virtual {
        TOKEN.safeTransfer(RECEIVER, amount);
    }
}
