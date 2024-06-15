// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/access/Ownable2Step.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract ZunVestingDistributor is Ownable2Step {
    using SafeERC20 for IERC20;

    error WrongArguments();
    error WrongStartTimestamp();
    error EmptyAddress();
    error EmptyRecipient(uint256 index);
    error ZeroAllocation(uint256 index);
    error ZeroClaimable();

    uint64 public immutable startTimestamp;
    uint64 public immutable durationSeconds;
    IERC20 public immutable token;

    mapping(address => uint256) public claimed;
    mapping(address => uint256) public allocation;

    uint256 public totalClaimed;
    uint256 public totalAllocation;

    event Claimed(address indexed user, uint256 amount);
    event Allocated(address indexed user, uint256 amount);

    constructor(
        address[] memory recipients_,
        uint256[] memory allocations_,
        uint64 startTimestamp_,
        uint64 durationSeconds_,
        address token_,
        address owner_
    ) Ownable(owner_) {
        uint256 length = recipients_.length;
        if (length != allocations_.length) revert WrongArguments();
        if (token_ == address(0)) revert EmptyAddress();

        for (uint8 i; i < length; ++i) {
            if (recipients_[i] == address(0)) revert EmptyRecipient(i);
            if (allocations_[i] == 0) revert ZeroAllocation(i);
            allocation[recipients_[i]] = allocations_[i];
            totalAllocation += allocations_[i];
            emit Allocated(recipients_[i], allocations_[i]);
        }
        startTimestamp = startTimestamp_;
        durationSeconds = durationSeconds_;
        token = IERC20(token_);
    }

    function claim() public {
        uint256 amount = claimable(msg.sender);
        if (amount == 0) revert ZeroClaimable();
        claimed[msg.sender] += amount;
        totalClaimed += amount;
        emit Claimed(msg.sender, amount);
        token.safeTransfer(msg.sender, amount);
    }

    function claimable(address user) public view returns (uint256) {
        return claimableAmountOn(uint64(block.timestamp), user) - claimed[user];
    }

    function claimableAmountOn(uint64 timestamp, address user) public view returns (uint256) {
        uint256 userAllocation = allocation[user];
        if (timestamp < startTimestamp) {
            return 0;
        } else if (timestamp >= vestingEnd()) {
            return userAllocation;
        } else {
            return (userAllocation * (timestamp - startTimestamp)) / durationSeconds;
        }
    }

    function vestingEnd() public view returns (uint256) {
        return startTimestamp + durationSeconds;
    }

    function withdrawEmergency(IERC20 _token) external onlyOwner {
        uint256 tokenBalance = _token.balanceOf(address(this));
        if (tokenBalance > 0) {
            _token.safeTransfer(msg.sender, tokenBalance);
        }
    }
}
