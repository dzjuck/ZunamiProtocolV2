// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../utils/Constants.sol';
import '../../strategies/VaultStrat.sol';

contract ZunBTCVaultStrat is VaultStrat {
    constructor()
        VaultStrat(
            [
                IERC20(Constants.WBTC_ADDRESS),
                IERC20(Constants.TBTC_ADDRESS),
                IERC20(address(0)),
                IERC20(address(0)),
                IERC20(address(0))
            ],
            [uint256(1e10), 1, 0, 0, 0]
        )
    {}
}
