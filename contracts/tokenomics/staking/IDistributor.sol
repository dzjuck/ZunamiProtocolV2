// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IDistributor {
    function distribute(address token, uint256 amount) external;
}
