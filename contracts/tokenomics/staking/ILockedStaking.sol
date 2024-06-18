// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface ILockedStaking {
    function deposit(uint256 _amount, address _receiver) external;

    function depositWithPermit(
        uint256 _amount,
        address _receiver,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external;

    function withdraw(
        uint256 _lockIndex,
        bool _claimRewards,
        address _tokenReceiver
    ) external;
}
