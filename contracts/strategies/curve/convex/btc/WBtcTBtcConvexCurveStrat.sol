//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../../utils/Constants.sol';
import './BtcConvexCurveStratBase.sol';

contract WBtcTBtcConvexCurveStrat is BtcConvexCurveStratBase {
    constructor()
        BtcConvexCurveStratBase(
            [
                IERC20(Constants.WBTC_ADDRESS),
                IERC20(Constants.TBTC_ADDRESS),
                IERC20(address(0)),
                IERC20(address(0)),
                IERC20(address(0))
            ],
            [uint256(1e10), 1, 0, 0, 0],
            Constants.CRV_WBTC_TBTC_ADDRESS,
            Constants.CRV_WBTC_TBTC_LP_ADDRESS,
            Constants.CRV_BOOSTER_ADDRESS,
            Constants.CVX_WBTC_TBTC_REWARDS_ADDRESS,
            Constants.CVX_WBTC_TBTC_PID
        )
    {}
}
