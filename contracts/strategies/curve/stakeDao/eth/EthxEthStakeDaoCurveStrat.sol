//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../../utils/Constants.sol';
import './EthStakeDaoCurveStratBase.sol';

contract EthxEthStakeDaoCurveStrat is EthStakeDaoCurveStratBase {
    constructor()
        EthStakeDaoCurveStratBase(
            [
                IERC20(Constants.WETH_ADDRESS),
                IERC20(Constants.FRX_ETH_ADDRESS),
                IERC20(address(0)),
                IERC20(address(0)),
                IERC20(address(0))
            ],
            [uint256(1), 1, 0, 0, 0],
            Constants.SDT_ETH_ETHX_VAULT_ADDRESS,
            Constants.CRV_ETH_ETHX_ADDRESS,
            Constants.CRV_ETH_ETHX_LP_ADDRESS
        )
    {}
}
