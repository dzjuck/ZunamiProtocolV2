// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import { ZUNStakingRewardDistributor } from '../tokenomics/staking/ZUNStakingRewardDistributor.sol';

/**
 * @title ZUNStakingRewardDistributorVotes contract
 * @notice Contract for testing Votes of ZUNStakingRewardDistributor
 */
contract ZUNStakingRewardDistributorVotes is ZUNStakingRewardDistributor {
    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }
}
