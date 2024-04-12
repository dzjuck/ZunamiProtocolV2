//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import './BaseStakingRewardDistributor.sol';

contract StakingRewardDistributor is BaseStakingRewardDistributor {
    using SafeERC20 for IERC20;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    // Deposit token
    function deposit(uint256 _amount, address _receiver) external nonReentrant {
        if (_amount == 0) revert ZeroAmount();

        if (_receiver == address(0)) {
            _receiver = msg.sender;
        }

        uint256[] memory distributions = _updateDistributions();
        _checkpointRewards(_receiver, distributions, false, address(0));

        token.safeTransferFrom(msg.sender, address(this), _amount);

        totalAmount += _amount;
        _mint(_receiver, _amount);

        emit Deposited(_receiver, _amount);
    }

    // Withdraw token
    function withdraw(
        uint256 _amount,
        bool _claimRewards,
        address _receiver
    ) external nonReentrant {
        if (_receiver == address(0)) {
            _receiver = msg.sender;
        }

        if (balanceOf(msg.sender) < _amount) revert WrongAmount();

        uint256[] memory distributions = _updateDistributions();
        _checkpointRewards(msg.sender, distributions, _claimRewards, address(0));

        if (_amount > 0) {
            _burn(msg.sender, _amount);
            totalAmount -= _amount;
            token.safeTransfer(address(_receiver), _amount);
        }

        emit Withdrawn(msg.sender, _amount);
    }
}
