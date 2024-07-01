// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/access/Ownable2Step.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../../../interfaces/IGauge.sol';
import '../../../interfaces/IVotium.sol';

contract VotiumGauge is IGauge, Ownable2Step {
    using SafeERC20 for IERC20;

    // https://votium.app/
    IERC20 public immutable TOKEN;
    IVotium public immutable VOTIUM;
    address public immutable GAUGE;

    constructor(address _token, address _votium, address _gauge) Ownable(msg.sender) {
        require(_token != address(0), 'Zero token address');
        TOKEN = IERC20(_token);

        require(_votium != address(0), 'Zero votium address');
        VOTIUM = IVotium(_votium);

        require(_gauge != address(0), 'Zero gauge address');
        GAUGE = _gauge;
    }

    function distribute(uint256 amount) external virtual {
        TOKEN.safeIncreaseAllowance(address(VOTIUM), amount);
        try VOTIUM.depositIncentiveSimple(address(TOKEN), amount, GAUGE) {
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
