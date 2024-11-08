// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/access/Ownable2Step.sol';

import '../../../@chainlink/contracts/src/v0.8/Denominations.sol';
import '../../../@chainlink/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol';

import '../../interfaces/IOracle.sol';
import '../../interfaces/vendor/ICurvePoolOraclePrice.sol';

interface ILlammaOracle {
    function price() external view returns (uint256);
}

contract LlammaOracle is IOracle {

    error WrongToken();

    ILlammaOracle public immutable llammaOracle;
    address public immutable token;

    constructor(address _llamaOracle, address _token) {
        if (_llamaOracle == address(0) || _token == address(0)) revert ZeroAddress();
        llammaOracle = ILlammaOracle(_llamaOracle);
        token = _token;
    }

    function isTokenSupported(address _token) public view override returns (bool) {
        return token == _token;
    }

    function getUSDPrice(address _token) external view returns (uint256) {
        if (!isTokenSupported(_token)) revert WrongToken();
        return llammaOracle.price();
    }
}
