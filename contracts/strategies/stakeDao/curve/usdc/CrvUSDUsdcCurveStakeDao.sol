//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../../Constants.sol";
import './UsdcCurveStakeDaoStrat.sol';

contract CrvUSDUsdcCurveStakeDao is UsdcCurveStakeDaoStrat {
    constructor()
    UsdcCurveStakeDaoStrat(
            Constants.SDT_CRVUSD_USDC_VAULT_ADDRESS,
            Constants.CRV_CRVUSD_USDC_ADDRESS,
            Constants.CRV_CRVUSD_USDC_LP_ADDRESS
        )
    {}
}
