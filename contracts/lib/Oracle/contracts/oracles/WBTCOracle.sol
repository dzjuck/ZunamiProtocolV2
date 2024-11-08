// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/access/Ownable2Step.sol';

import '../../../@chainlink/contracts/src/v0.8/Denominations.sol';
import '../../../@chainlink/contracts/src/v0.8/interfaces/FeedRegistryInterface.sol';

import '../../interfaces/IOracle.sol';
import '../../interfaces/vendor/ICurvePoolOraclePrice.sol';

contract WBTCOracle is IOracle {
    error WrongToken();

    FeedRegistryInterface internal constant _feedRegistry =
        FeedRegistryInterface(0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf);

    address internal constant WBTC_ADDRESS = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;

    IOracle private immutable _genericOracle;

    constructor(address genericOracle) {
        _genericOracle = IOracle(genericOracle);
    }

    function isTokenSupported(address token) public pure override returns (bool) {
        return token == WBTC_ADDRESS;
    }

    function getUSDPrice(address token) external view returns (uint256) {
        if (!isTokenSupported(token)) revert WrongToken();
        return (_getPrice(token, Denominations.BTC) *
            _getPrice(Denominations.BTC, Denominations.USD)) / 1e18;
    }

    function _getPrice(
        address token,
        address denomination
    ) internal view returns (uint256) {
        try _feedRegistry.latestRoundData(token, denomination) returns (
            uint80 roundID_,
            int256 price_,
            uint256,
            uint256 timeStamp_,
            uint80 answeredInRound_
        ) {
            require(timeStamp_ != 0, 'round not complete');
            require(price_ != 0, 'negative price');
            require(answeredInRound_ >= roundID_, 'stale price');
            return _scaleFrom(uint256(price_), _feedRegistry.decimals(token, denomination));
        } catch Error(string memory reason) {
            revert(reason);
        }
    }

    function _scaleFrom(uint256 value, uint8 decimals) internal pure returns (uint256) {
        if (decimals == 18) return value;
        if (decimals > 18) return value / 10 ** (decimals - 18);
        else return value * 10 ** (18 - decimals);
    }
}
