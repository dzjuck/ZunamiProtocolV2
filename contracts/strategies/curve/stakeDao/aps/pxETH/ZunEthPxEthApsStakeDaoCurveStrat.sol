//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../../../utils/Constants.sol';
import './PxEthApsStakeDaoCurveStratBase.sol';

contract ZunEthPxEthApsStakeDaoCurveStrat is PxEthApsStakeDaoCurveStratBase {
    constructor()
        PxEthApsStakeDaoCurveStratBase(
            [
                IERC20(Constants.zunETH_ADDRESS),
                IERC20(address(0)),
                IERC20(address(0)),
                IERC20(address(0)),
                IERC20(address(0))
            ],
            [uint256(1), 0, 0, 0, 0],
            Constants.SDT_zunETH_pxETH_VAULT_ADDRESS,
            Constants.CRV_zunETH_pxETH_ADDRESS,
            Constants.CRV_zunETH_pxETH_LP_ADDRESS,
            Constants.zunETH_CONTROLLER_ADDRESS,
            Constants.zunETH_ADDRESS
        )
    {}
}
