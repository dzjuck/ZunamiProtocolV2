//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../../Constants.sol";
import './UsdtCurveStakeDaoStrat.sol';

contract CrvUSDUsdtCurveStakeDao is UsdtCurveStakeDaoStrat {
    constructor()
    UsdtCurveStakeDaoStrat(
            Constants.SDT_CRVUSD_USDT_VAULT_ADDRESS,
            Constants.CRV_CRVUSD_USDT_ADDRESS,
            Constants.CRV_CRVUSD_USDT_LP_ADDRESS
        )
    {}
}
