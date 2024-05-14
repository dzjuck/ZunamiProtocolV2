// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/access/Ownable2Step.sol';

import '../../interfaces/IOracle.sol';
import '../../interfaces/vendor/ICurvePoolOraclePrice.sol';

contract WETHOracle is IOracle {
    error WrongToken();

    address internal constant WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    address public constant CHAINLINK_FEED_REGISTRY_ETH_ADDRESS =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    IOracle private immutable _genericOracle;

    constructor(address genericOracle) {
        _genericOracle = IOracle(genericOracle);
    }

    function isTokenSupported(address token) public pure override returns (bool) {
        return token == WETH_ADDRESS;
    }

    function getUSDPrice(address token) external view returns (uint256) {
        if (!isTokenSupported(token)) revert WrongToken();
        return _genericOracle.getUSDPrice(CHAINLINK_FEED_REGISTRY_ETH_ADDRESS);
    }
}
