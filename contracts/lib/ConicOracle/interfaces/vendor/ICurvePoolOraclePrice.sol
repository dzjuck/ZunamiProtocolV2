// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

interface ICurvePoolOraclePrice {
    function price_oracle() external view returns (uint256);
}
