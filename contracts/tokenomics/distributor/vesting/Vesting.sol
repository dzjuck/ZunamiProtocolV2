// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/access/Ownable2Step.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';


contract Vesting is Ownable2Step {
    uint64 public immutable startTimestamp;
    uint64 public immutable durationSeconds;
    address public immutable zunToken;

    mapping(address => uint256) public releasedByUser;
    mapping(address => uint256) public balances;

    event Released(address indexed user, uint256 amount);
    error WrongArguments();
    error WrongStartTimestamp();
    error ZeroAddress();

    constructor(
        address[] memory beneficiaries_,
        uint256[] memory balances_,
        uint64 startTimestamp_,
        uint64 durationSeconds_,
        address zunToken_,
        address owner_
    ) payable Ownable(owner_) {
        uint256 beneficiariesLength = beneficiaries_.length;
        if (beneficiariesLength != balances_.length) revert WrongArguments();
        if (startTimestamp_ < block.timestamp) revert WrongStartTimestamp();
        if (zunToken_ == address(0)) revert ZeroAddress();

        for (uint8 i; i < beneficiariesLength; ++i) {
            if (beneficiaries_[i] == address(0)) revert ZeroAddress();
            if (balances_[i] == 0)
            balances[beneficiaries_[i]] = balances_[i];
        }
        startTimestamp = startTimestamp_;
        durationSeconds = durationSeconds_;
        zunToken = zunToken_;
    }

    function release() public {
        uint256 amount = releasable(msg.sender);
        releasedByUser[msg.sender] += amount;
        emit Released(msg.sender, amount);
        SafeERC20.safeTransfer(IERC20(zunToken), msg.sender, amount);
    }

    function releasable(address user) public view returns (uint256) {
        return vestedAmount(user, uint64(block.timestamp)) - releasedByUser[user];
    }

    function vestedAmount(address user, uint64 timestamp) public view returns (uint256) {
        return _vestingSchedule(balances[user], timestamp);
    }

    function _vestingSchedule(
        uint256 userAllocation,
        uint64 timestamp
    ) internal view returns (uint256) {
        if (timestamp < startTimestamp) {
            return 0;
        } else if (timestamp >= end()) {
            return userAllocation;
        } else {
            return (userAllocation * (timestamp - startTimestamp)) / durationSeconds;
        }
    }

    function end() public view returns (uint256) {
        return startTimestamp + durationSeconds;
    }
}
