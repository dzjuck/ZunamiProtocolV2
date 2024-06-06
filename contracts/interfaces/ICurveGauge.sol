// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface ICurveGauge {
    function deposit_reward_token(address _reward_token, uint256 _amount, uint256 _epoch) external;
}
