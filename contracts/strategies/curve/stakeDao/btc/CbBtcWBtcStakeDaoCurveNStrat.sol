//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import '../../../../utils/Constants.sol';
import './BtcStakeDaoCurveNStratBase.sol';

contract CbBtcWBtcStakeDaoCurveNStrat is BtcStakeDaoCurveNStratBase {
    constructor()
        BtcStakeDaoCurveNStratBase(
            [
                IERC20(Constants.WBTC_ADDRESS),
                IERC20(Constants.TBTC_ADDRESS),
                IERC20(address(0)),
                IERC20(address(0)),
                IERC20(address(0))
            ],
            [uint256(1e10), 1, 0, 0, 0],
            Constants.SDT_CBBTC_WBTC_VAULT_ADDRESS,
            Constants.CRV_CBBTC_WBTC_ADDRESS,
            Constants.CRV_CBBTC_WBTC_LP_ADDRESS
        )
    {}
}
