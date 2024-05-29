// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';
import '../../interfaces/IPool.sol';
import './IZUNStakingRewardDistributor.sol';
import '../../RewardTokenManager.sol';
import { stEthEthConvexCurveStrat } from '../../strategies/curve/convex/eth/stEthEthConvexCurveStrat.sol';

contract RecapitalizationManager is AccessControl, RewardTokenManager {
    using SafeERC20 for IERC20;

    error WrongRewardDistributionTimestamp(uint256 rewardDistributionTimestamp, uint256 nowTimestamp);
    error WrongTid(uint256 tid);
    error ZeroAddress();
    error ZeroParam();

    bytes32 public constant EMERGENCY_ADMIN_ROLE = keccak256('EMERGENCY_ADMIN_ROLE');

    IERC20 public immutable zunToken;

    uint256 public rewardDistributionTimestamp;
    IZUNStakingRewardDistributor public stakingRewardDistributor;
    uint256 public accumulationPeriod;

    event SetRewardDistributor(address rewardDistributorAddr);
    event SetAccumulationPeriod(uint256 accumulationPeriod);
    event RecapitalizedPoolByRewards(
        address rewardManager,
        address pool,
        uint256 sid,
        uint256 tid,
        uint256 rewardDistributionTimestamp,
        uint256[] rewardAmounts
    );
    event DistributedRewards(uint256 rewardDistributionTimestamp);
    event RecapitalizedPoolByStackedZun(
        uint256 zunAmount,
        address rewardManager,
        address pool,
        uint256 sid,
        uint256 tid
    );
    event RestoredStakedZunByRewards(
        uint256 zunReturnTokenAmount,
        address rewardManager,
        uint256 rewardDistributionTimestamp
    );
    event WithdrawnEmergency(address token, uint256 amount);

    constructor(address zunToken_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ADMIN_ROLE, msg.sender);
        rewardDistributionTimestamp = block.timestamp;

        if (zunToken_ == address(0)) revert ZeroAddress();
        zunToken = IERC20(zunToken_);

        setAccumulationPeriod(7 * 24 * 60 * 60); // 1 week in seconds
    }

    function setRewardTokens(IERC20[] memory rewardTokens_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setRewardTokens(rewardTokens_);
    }

    function setRewardDistributor(
        address rewardDistributorAddr
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (rewardDistributorAddr == address(0)) revert ZeroAddress();

        stakingRewardDistributor = IZUNStakingRewardDistributor(rewardDistributorAddr);
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
        if (block.timestamp < rewardDistributionTimestamp + accumulationPeriod)
            revert WrongRewardDistributionTimestamp(rewardDistributionTimestamp, block.timestamp);

        rewardDistributionTimestamp = block.timestamp;

        uint256 transferAmount;
        IERC20 token_;
        uint256 rewardTokensLength = rewardTokens.length;
        for (uint256 i = 0; i < rewardTokensLength; ++i) {
            token_ = rewardTokens[i];
            if (address(token_) == address(0)) break;
            transferAmount = token_.balanceOf(address(this));
            if (transferAmount > 0) {
                token_.safeIncreaseAllowance(address(stakingRewardDistributor), transferAmount);
                stakingRewardDistributor.distribute(address(token_), transferAmount);
            }
        }

        emit DistributedRewards(rewardDistributionTimestamp);
    }

    function recapitalizePoolByRewards(
        IRewardManager rewardManager,
        IPool pool,
        uint256 sid,
        uint256 tid,
        uint256[] memory rewardAmounts
    ) external onlyRole(EMERGENCY_ADMIN_ROLE) {
        IERC20 depositedToken = pool.token(tid);
        if (address(depositedToken) == address(0)) revert WrongTid(tid);

        _sellRewardsByAmounts(rewardManager, depositedToken, rewardAmounts);

        _depositToken(pool, sid, tid, depositedToken);

        rewardDistributionTimestamp = block.timestamp;

        emit RecapitalizedPoolByRewards(
            address(rewardManager),
            address(pool),
            sid,
            tid,
            rewardDistributionTimestamp,
            rewardAmounts
        );
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

        stakingRewardDistributor.withdrawToken(zunAmount);

        _sellToken(rewardManager, zunToken, zunAmount, address(depositedToken));
        _depositToken(pool, sid, tid, depositedToken);

        emit RecapitalizedPoolByStackedZun(
            zunAmount,
            address(rewardManager),
            address(pool),
            sid,
            tid
        );
    }

    function restoreStakedZunByRewards(
        IRewardManager rewardManager
    ) external onlyRole(EMERGENCY_ADMIN_ROLE) {
        _sellRewardsAll(rewardManager, zunToken, 0);
        uint256 zunTokenReturnAmount = zunToken.balanceOf(address(this));
        uint256 recapitalizedAmount = stakingRewardDistributor.recapitalizedAmount();
        if (zunTokenReturnAmount > recapitalizedAmount) {
            zunTokenReturnAmount = recapitalizedAmount;
        }

        zunToken.safeIncreaseAllowance(address(stakingRewardDistributor), zunTokenReturnAmount);
        stakingRewardDistributor.returnToken(zunTokenReturnAmount);

        rewardDistributionTimestamp = block.timestamp;

        emit RestoredStakedZunByRewards(
            zunTokenReturnAmount,
            address(rewardManager),
            rewardDistributionTimestamp
        );
    }

    /**
     * @dev Allows the owner to emergency withdraw tokens from the contract.
     * @param _token The IERC20 token to withdraw from.
     * @notice Only the account with the DEFAULT_ADMIN_ROLE can withdraw tokens.
     */
    function withdrawEmergency(
        IERC20 _token
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 tokenBalance = _token.balanceOf(address(this));
        if (tokenBalance > 0) {
            _token.safeTransfer(msg.sender, tokenBalance);
        }

        emit WithdrawnEmergency(address(_token), tokenBalance);
    }

    function _depositToken(IPool pool, uint256 sid, uint256 tid, IERC20 depositedToken) internal {
        uint256 depositedTokenBalance = depositedToken.balanceOf(address(this));
        if (depositedTokenBalance == 0) return;

        depositedToken.safeTransfer(address(pool), depositedTokenBalance);

        uint256[5] memory amounts;
        amounts[tid] = depositedTokenBalance;
        pool.depositStrategy(sid, amounts);
    }
}
