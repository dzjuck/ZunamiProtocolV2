//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../../../utils/Constants.sol';
import './CrvUsdApsStakeDaoCurveStratBase.sol';

contract ZunUsdCrvUsdApsStakeDaoCurveStrat is CrvUsdApsStakeDaoCurveStratBase {
    constructor()
        CrvUsdApsStakeDaoCurveStratBase(
            [
                IERC20(Constants.ZUNUSD_ADDRESS),
                IERC20(address(0)),
                IERC20(address(0)),
                IERC20(address(0)),
                IERC20(address(0))
            ],
            [uint256(1), 0, 0, 0, 0],
            Constants.SDT_zunUSD_crvUSD_VAULT_ADDRESS,
            Constants.CRV_zunUSD_crvUSD_ADDRESS,
            Constants.CRV_zunUSD_crvUSD_LP_ADDRESS,
            Constants.zunUSD_CONTROLLER_ADDRESS,
            Constants.ZUNUSD_ADDRESS
        )
    {}
}
