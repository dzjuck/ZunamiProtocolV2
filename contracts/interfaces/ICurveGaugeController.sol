//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface ICurveGaugeController {
    function get_total_weight() external view returns (uint256);
}
