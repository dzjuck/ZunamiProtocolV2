// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import '../../interfaces/IOracle.sol';

contract FixedOracle is IOracle {
    error ZeroAddress();
    error ZeroUsdPrice();
    error WrongToken();

    address public immutable token;
    uint256 public immutable usdPrice;

    constructor(address _token, uint256 _usdPrice) {
        if (_token == address(0)) revert ZeroAddress();
        token = _token;
        if (_usdPrice == 0) revert ZeroUsdPrice();
        usdPrice = _usdPrice;
    }

    function isTokenSupported(address _token) external view override returns (bool) {
        return _token == token;
    }

    // Prices are always provided with 18 decimals pecision
    function getUSDPrice(address _token) external view returns (uint256) {
        if (_token != token) revert WrongToken();
        return usdPrice;
    }
}
