//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../../utils/Constants.sol';
import './EthStakeDaoCurveNStratBase.sol';

contract pxETHwETHStakeDaoCurveNStrat is EthStakeDaoCurveNStratBase {
    constructor()
        EthStakeDaoCurveNStratBase(
            [
                IERC20(Constants.WETH_ADDRESS),
                IERC20(Constants.FRX_ETH_ADDRESS),
                IERC20(address(0)),
                IERC20(address(0)),
                IERC20(address(0))
            ],
            [uint256(1), 1, 0, 0, 0],
            Constants.SDT_PXETH_WETH_VAULT_ADDRESS,
            Constants.CRV_PXETH_WETH_ADDRESS,
            Constants.CRV_PXETH_WETH_LP_ADDRESS
        )
    {}
}
