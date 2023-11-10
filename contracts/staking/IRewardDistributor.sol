// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IRewardDistributor {
    function distribute(uint256 tid, uint256 amount) external;
}
