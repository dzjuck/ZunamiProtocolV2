//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../../../utils/Constants.sol';
import '../TokenCrvUsdStakeDaoCurveStratBase.sol';

contract FraxCrvUsdStakeDaoCurve is TokenCrvUsdStakeDaoCurveStratBase {
    constructor()
        TokenCrvUsdStakeDaoCurveStratBase(
            [
                IERC20(Constants.DAI_ADDRESS),
                IERC20(Constants.USDC_ADDRESS),
                IERC20(Constants.USDT_ADDRESS),
                IERC20(address(0)),
                IERC20(address(0))
            ],
            [uint256(1), 1e12, 1e12, 0, 0],
            Constants.SDT_FRAX_CRVUSD_VAULT_ADDRESS,
            Constants.CRV_FRAX_CRVUSD_ADDRESS,
            Constants.CRV_FRAX_CRVUSD_LP_ADDRESS,
            Constants.FRAX_ADDRESS
        )
    {}
}
