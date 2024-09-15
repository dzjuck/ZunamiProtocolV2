// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import './IDistributor.sol';

interface IRecapitalizedStakingRewardDistributor is IDistributor {
    function withdrawToken(uint256 amount) external;

    function returnToken(uint256 amount) external;

    function recapitalizedAmount() external view returns (uint256);
}
