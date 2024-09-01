// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../utils/BaseConstants.sol';
import '../../../strategies/VaultStrat.sol';

contract ZunUSDBaseApsVaultStrat is VaultStrat {
    constructor()
        VaultStrat(
            [
                IERC20(BaseConstants.ZUNUSD_ADDRESS),
                IERC20(BaseConstants.ZUNUSD_NATIVE_ADDRESS),
                IERC20(address(0)),
                IERC20(address(0)),
                IERC20(address(0))
            ],
            [uint256(1), uint256(1), 0, 0, 0]
        )
    {}
}
