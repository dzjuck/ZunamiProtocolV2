// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/access/Ownable2Step.sol';

import '../../interfaces/IOracle.sol';
import '../../interfaces/vendor/ICurvePoolOraclePrice.sol';

contract FxnOracle is IOracle {
    error WrongToken();

    address internal constant FXN_ADDRESS = 0x365AccFCa291e7D3914637ABf1F7635dB165Bb09;
    address internal constant ETH_FXN_CURVE_ADDRESS = 0xC15F285679a1Ef2d25F53D4CbD0265E1D02F2A92;
    ICurvePoolOraclePrice internal constant ETH_FXN_CURVE_ORACLE =
        ICurvePoolOraclePrice(ETH_FXN_CURVE_ADDRESS);
    address public constant CHAINLINK_FEED_REGISTRY_ETH_ADDRESS =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    IOracle private immutable _genericOracle;

    constructor(address genericOracle) {
        _genericOracle = IOracle(genericOracle);
    }

    function isTokenSupported(address token) public pure override returns (bool) {
        return token == FXN_ADDRESS;
    }

    function getUSDPrice(address token) external view returns (uint256) {
        if (!isTokenSupported(token)) revert WrongToken();
        return
            (_genericOracle.getUSDPrice(CHAINLINK_FEED_REGISTRY_ETH_ADDRESS) *
                ETH_FXN_CURVE_ORACLE.price_oracle()) / 1e18;
    }
}
