// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/access/Ownable2Step.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../../../interfaces/IGauge.sol';
import '../../../interfaces/ICurveGauge.sol';

contract CurveGaugeGauge is IGauge, Ownable2Step {
    using SafeERC20 for IERC20;

    uint256 public constant WEEK  = 604800;

    ICurveGauge public immutable CURVE_GAUGE;
    IERC20 public immutable TOKEN;

    constructor(address _token, address _curveGauge) Ownable(msg.sender) {
        require(_token != address(0), 'Zero token address');
        TOKEN = IERC20(_token);

        require(_curveGauge != address(0), 'Zero receiver address');
        CURVE_GAUGE = ICurveGauge(_curveGauge);
    }

    function distribute(uint256 amount) external virtual {
        TOKEN.safeIncreaseAllowance(address(CURVE_GAUGE), amount);
        CURVE_GAUGE.deposit_reward_token(address(TOKEN), amount, WEEK);
    }

    function withdrawEmergency(IERC20 _token) external onlyOwner {
        uint256 tokenBalance = _token.balanceOf(address(this));
        if (tokenBalance > 0) {
            _token.safeTransfer(msg.sender, tokenBalance);
        }
    }
}
