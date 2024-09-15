//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol';

import './BaseStakingRewardDistributor.sol';

contract LockedStakingRewardDistributor is
    BaseStakingRewardDistributor
{
    using SafeERC20 for IERC20;

    error LockDoesNotExist();
    error Unlocked();
    error NotTransferable();

    uint16 public constant EXIT_PERCENT = 150; // 15%
    uint16 public constant PERCENT_DENOMINATOR = 1e3;

    struct LockInfo {
        uint128 amount;
        uint128 untilTimestamp;
    }

    mapping(address => LockInfo[]) public userLocks;
    uint256 public lockPeriod;
    address public earlyExitReceiver;

    event Deposited(address indexed user, uint256 lockIndex, uint256 amount, uint256 untilTimestamp);
    event Withdrawn(
        address indexed user,
        uint256 lockIndex,
        uint256 amount,
        uint256 transferedAmount
    );
    event EarlyExitReceiverChanged(address receiver);
    event LockPeriodChanged(uint256 lockPeriodSec);
    event WithdrawnToken(uint256 amount);
    event ReturnedToken(uint256 amount);

    function initializeExtension() internal override {
        setEarlyExitReceiver(msg.sender);
        setLockedPeriod(7 * 24 * 60 * 60); // 7 days
    }

    function setEarlyExitReceiver(address _receiver) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_receiver == address(0)) revert ZeroAddress();
        earlyExitReceiver = _receiver;
        emit EarlyExitReceiverChanged(_receiver);
    }

    function setLockedPeriod(uint256 _lockPeriod) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_lockPeriod == 0) revert ZeroAmount();
        lockPeriod = _lockPeriod;
        emit LockPeriodChanged(_lockPeriod);
    }

    // Returns the number of locks for a user.
    function userLockCount(address _user) public view returns (uint256) {
        return userLocks[_user].length;
    }

    // Deposit tokens to staking for reward token allocation.
    function deposit(uint256 _amount, address _receiver) external nonReentrant {
        _deposit(_amount, _receiver);
    }

    function depositWithPermit(
        uint256 _amount,
        address _receiver,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external nonReentrant {
        IERC20Permit tokenPermit = IERC20Permit(address(token));
        // the use of `try/catch` allows the permit to fail and makes the code tolerant to frontrunning.
        try
            tokenPermit.permit(msg.sender, address(this), _amount, _deadline, _v, _r, _s)
        {} catch {}
        _deposit(_amount, _receiver);
    }

    function _deposit(uint256 _amount, address _receiver) internal {
        if (_amount == 0) revert ZeroAmount();

        if (_receiver == address(0)) {
            _receiver = msg.sender;
        }

        uint256[] memory distributions = _updateDistributions();
        _checkpointRewards(_receiver, distributions, false, address(0));

        token.safeTransferFrom(msg.sender, address(this), _amount);

        totalAmount += _amount;

        _mint(_receiver, _amount);

        uint128 untilTimestamp = uint128(block.timestamp + lockPeriod);
        uint256 lockIndex = userLocks[_receiver].length;
        userLocks[_receiver].push(LockInfo(uint128(_amount), untilTimestamp));
        emit Deposited(_receiver, lockIndex, _amount, untilTimestamp);
    }

    // Withdraw tokens from rewardToken staking.
    function withdraw(
        uint256 _lockIndex,
        bool _claimRewards,
        address _tokenReceiver
    ) external nonReentrant {
        LockInfo[] storage locks = userLocks[msg.sender];
        if (locks.length <= _lockIndex) revert LockDoesNotExist();

        LockInfo storage lock = locks[_lockIndex];
        uint256 untilTimestamp = lock.untilTimestamp;
        if (untilTimestamp == 0) revert Unlocked();
        uint256 amount = lock.amount;

        uint256[] memory distributions = _updateDistributions();
        _checkpointRewards(msg.sender, distributions, _claimRewards, _tokenReceiver);

        _burn(msg.sender, amount);
        totalAmount -= amount;

        // Set untilTimestamp to 0 to mark the lock as withdrawn.
        lock.untilTimestamp = 0;

        uint256 transferredAmount = amount;
        if (block.timestamp < untilTimestamp) {
            transferredAmount =
                (amount * (PERCENT_DENOMINATOR - EXIT_PERCENT)) /
                PERCENT_DENOMINATOR;

            token.safeTransfer(earlyExitReceiver, amount - transferredAmount);
        }

        if (_tokenReceiver == address(0)) {
            _tokenReceiver = msg.sender;
        }
        token.safeTransfer(address(_tokenReceiver), transferredAmount);

        emit Withdrawn(msg.sender, _lockIndex, amount, transferredAmount);
    }
}
