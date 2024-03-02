// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../../staking/IDistributor.sol';
import '../../../interfaces/IGauge.sol';

contract StakingRewardDistributorGauge is IGauge {
    using SafeERC20 for ERC20;

    IDistributor public immutable REWARD_DISTRIBUTOR;
    ERC20 public immutable TOKEN;

    constructor(address _token, address _tokenDistributor) {
        require(_token != address(0), 'Zero token address');
        TOKEN = ERC20(_token);

        require(_tokenDistributor != address(0), 'Zero receiver address');
        REWARD_DISTRIBUTOR = IDistributor(_tokenDistributor);
    }

    function distribute(uint256 amount) external virtual {
        TOKEN.safeIncreaseAllowance(address(REWARD_DISTRIBUTOR), amount);
        REWARD_DISTRIBUTOR.distribute(address(TOKEN), amount);
    }
}
