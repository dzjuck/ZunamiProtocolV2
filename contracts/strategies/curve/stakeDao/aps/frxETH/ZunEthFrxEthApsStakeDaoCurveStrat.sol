//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../../../utils/Constants.sol';
import './FrxEthApsStakeDaoCurveStratBase.sol';

contract ZunEthFrxEthApsStakeDaoCurveStrat is FrxEthApsStakeDaoCurveStratBase {
    constructor()
        FrxEthApsStakeDaoCurveStratBase(
            [
                IERC20(Constants.zunETH_ADDRESS),
                IERC20(address(0)),
                IERC20(address(0)),
                IERC20(address(0)),
                IERC20(address(0))
            ],
            [uint256(1), 0, 0, 0, 0],
            Constants.SDT_zunETH_frxETH_VAULT_ADDRESS,
            Constants.CRV_zunETH_frxETH_ADDRESS,
            Constants.CRV_zunETH_frxETH_LP_ADDRESS,
            Constants.zunETH_CONTROLLER_ADDRESS,
            Constants.zunETH_ADDRESS
        )
    {}
}
