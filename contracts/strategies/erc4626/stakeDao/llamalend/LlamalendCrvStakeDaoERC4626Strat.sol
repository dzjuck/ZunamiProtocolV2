//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../../utils/Constants.sol';
import './CrvUsdStakeDaoERC4626StratBase.sol';

contract LlamalendCrvStakeDaoERC4626Strat is CrvUsdStakeDaoERC4626StratBase {
    constructor()
        CrvUsdStakeDaoERC4626StratBase(
            [
                IERC20(Constants.DAI_ADDRESS),
                IERC20(Constants.USDC_ADDRESS),
                IERC20(Constants.USDT_ADDRESS),
                IERC20(address(0)),
                IERC20(address(0))
            ],
            [uint256(1), 1e12, 1e12, 0, 0],
            Constants.LLAMALEND_CRV_ADDRESS,
            Constants.CRVUSD_ADDRESS,
            Constants.SDT_LLAMALEND_CRV_VAULT_ADDRESS
        )
    {}
}
