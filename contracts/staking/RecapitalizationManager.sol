// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '../interfaces/IPool.sol';
import './IStakingRewardDistributor.sol';
import '../RewardTokenManager.sol';

contract RecapitalizationManager is AccessControl, RewardTokenManager {
    using SafeERC20 for IERC20;

    error WrongDistributionBlock(uint256 distributionBlock, uint256 nowBlock);
    error WrongTid(uint256 tid);
    error ZeroAddress();
    error ZeroParam();

    bytes32 public constant EMERGENCY_ADMIN_ROLE = keccak256('EMERGENCY_ADMIN_ROLE');
    uint256 public constant INITIAL_ACCUMULATION_PERIOD = (14 * 24 * 60 * 60) / 12; // 2 week in blocks

    IERC20 public immutable zunToken;

    uint256 public distributionBlock;
    IStakingRewardDistributor public stakingRewardDistributor;
    uint256 public accumulationPeriod;

    event SetRewardDistributor(address rewardDistributorAddr);
    event SetAccumulationPeriod(uint256 accumulationPeriod);

    constructor(address zunToken_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ADMIN_ROLE, msg.sender);
        distributionBlock = block.number;

        if (zunToken_ == address(0)) revert ZeroAddress();
        zunToken = IERC20(zunToken_);
        setAccumulationPeriod(INITIAL_ACCUMULATION_PERIOD);
    }

    function setRewardTokens(IERC20[] memory rewardTokens_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setRewardTokens(rewardTokens_);
    }

    function setRewardDistributor(
        address rewardDistributorAddr
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (rewardDistributorAddr == address(0)) revert ZeroAddress();

        stakingRewardDistributor = IStakingRewardDistributor(rewardDistributorAddr);
        emit SetRewardDistributor(rewardDistributorAddr);
    }

    function setAccumulationPeriod(
        uint256 _accumulationPeriod
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_accumulationPeriod == 0) revert ZeroParam();

        accumulationPeriod = _accumulationPeriod;
        emit SetAccumulationPeriod(_accumulationPeriod);
    }

    function distributeRewards() external {
        if (block.number < distributionBlock + accumulationPeriod)
            revert WrongDistributionBlock(distributionBlock, block.number);

        distributionBlock = block.number;

        uint256 transferAmount;
        IERC20 token_;
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            token_ = rewardTokens[i];
            if (address(token_) == address(0)) break;
            transferAmount = token_.balanceOf(address(this));
            if (
                transferAmount > 0 && stakingRewardDistributor.isRewardTokenAdded(address(token_))
            ) {
                token_.safeIncreaseAllowance(address(stakingRewardDistributor), transferAmount);
                uint256 tid = stakingRewardDistributor.rewardTokenTidByAddress(address(token_));
                stakingRewardDistributor.distribute(tid, transferAmount);
            }
        }
    }

    function recapitalizePoolByRewards(
        IRewardManager rewardManager,
        IPool pool,
        uint256 sid,
        uint256 tid
    ) external onlyRole(EMERGENCY_ADMIN_ROLE) {
        IERC20 depositedToken = pool.token(tid);
        if (address(depositedToken) == address(0)) revert WrongTid(tid);

        _sellRewards(rewardManager, depositedToken);

        _depositToken(pool, sid, tid, depositedToken);

        distributionBlock = block.number;
    }

    function recapitalizePoolByStackedZun(
        uint256 zunAmount,
        IRewardManager rewardManager,
        IPool pool,
        uint256 sid,
        uint256 tid
    ) external onlyRole(EMERGENCY_ADMIN_ROLE) {
        IERC20 depositedToken = pool.token(tid);
        if (address(depositedToken) == address(0)) revert WrongTid(tid);

        stakingRewardDistributor.withdrawPoolToken(address(zunToken), zunAmount);

        _sellToken(rewardManager, zunToken, zunAmount, address(depositedToken));
        _depositToken(pool, sid, tid, depositedToken);
    }

    function capitalizeStakedZunByRewards(
        IRewardManager rewardManager
    ) external onlyRole(EMERGENCY_ADMIN_ROLE) {
        _sellRewards(rewardManager, zunToken);
        uint256 zunTokenReturnAmount = zunToken.balanceOf(address(this));
        uint256 recapitalizedAmount = stakingRewardDistributor.poolPidByAddress(address(zunToken));
        if (zunTokenReturnAmount > recapitalizedAmount) {
            zunTokenReturnAmount = recapitalizedAmount;
        }

        zunToken.safeIncreaseAllowance(address(stakingRewardDistributor), zunTokenReturnAmount);
        stakingRewardDistributor.returnPoolToken(address(zunToken), zunTokenReturnAmount);

        distributionBlock = block.number;
    }

    function _depositToken(IPool pool, uint256 sid, uint256 tid, IERC20 depositedToken) internal {
        uint256 depositedTokenBalance = depositedToken.balanceOf(address(this));
        depositedToken.safeTransfer(address(pool), depositedTokenBalance);

        uint256[5] memory amounts;
        amounts[tid] = depositedTokenBalance;
        pool.depositStrategy(sid, amounts);
    }
}
