// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/access/Ownable2Step.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../../../interfaces/IGauge.sol';
import '../../../interfaces/IVotium.sol';

contract CurveGaugeGauge is IGauge, Ownable2Step {
    using SafeERC20 for IERC20;

    // https://votium.app/
    IVotium public constant VOTIUM = 0x63942E31E98f1833A234077f47880A66136a2D1e;
    IERC20 public immutable TOKEN;
    address public immutable CURVE_GAUGE;

    constructor(address _token, address _curveGauge) Ownable(msg.sender) {
        require(_token != address(0), 'Zero token address');
        TOKEN = IERC20(_token);

        require(_curveGauge != address(0), 'Zero receiver address');
        CURVE_GAUGE = _curveGauge;
    }

    function distribute(uint256 amount) external virtual {
        TOKEN.safeIncreaseAllowance(address(VOTIUM), amount);
        try VOTIUM.depositIncentiveSimple(address(TOKEN), amount, CURVE_GAUGE) {
        } catch {
            // do nothing, emergency withdraw stuck tokens
        }
    }

    function withdrawEmergency(IERC20 _token) external onlyOwner {
        uint256 tokenBalance = _token.balanceOf(address(this));
        if (tokenBalance > 0) {
            _token.safeTransfer(msg.sender, tokenBalance);
        }
    }
}
