// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

interface ICurvePriceOracle {
    function price_oracle() external view returns (uint256);
}
