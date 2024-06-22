// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IVotium {
    function depositIncentiveSimple(
        address _token,
        uint256 _amount,
        address _gauge
    ) external;

    // deposit same token to multiple gauges with different amounts in active round with no max and no exclusions
    function depositUnevenSplitGaugesSimple(
        address _token,
        address[] memory _gauges,
        uint256[] memory _amounts
    ) external;
}
