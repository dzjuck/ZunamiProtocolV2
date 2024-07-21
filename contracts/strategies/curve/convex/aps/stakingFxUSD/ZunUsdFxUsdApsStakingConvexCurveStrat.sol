//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../../../utils/Constants.sol';
import './FxUsdApsStakingConvexCurveStratBase.sol';

contract ZunUsdFxUsdApsStakingConvexCurveStrat is FxUsdApsStakingConvexCurveStratBase {
    constructor()
        FxUsdApsStakingConvexCurveStratBase(
            [
                IERC20(Constants.ZUNUSD_ADDRESS),
                IERC20(address(0)),
                IERC20(address(0)),
                IERC20(address(0)),
                IERC20(address(0))
            ],
            [uint256(1), 0, 0, 0, 0],
            Constants.CRV_zunUSD_fxUSD_ADDRESS,
            Constants.CRV_zunUSD_fxUSD_LP_ADDRESS,
            Constants.CRV_FX_BOOSTER_ADDRESS,
            Constants.CVX_zunUSD_fxUSD_PID,
            Constants.zunUSD_CONTROLLER_ADDRESS,
            Constants.ZUNUSD_ADDRESS
        )
    {}
}
