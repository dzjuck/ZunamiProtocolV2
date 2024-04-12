// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

interface ICurvePriceOracleNG {
    function price_oracle(uint256 i) external view returns (uint256);
}
