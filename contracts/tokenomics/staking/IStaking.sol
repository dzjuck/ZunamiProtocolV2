// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IStaking {
    // Deposit token
    function deposit(uint256 _amount, address _receiver) external;

    // Withdraw token
    function withdraw(
        uint256 _amount,
        bool _claimRewards,
        address _receiver
    ) external;
}
