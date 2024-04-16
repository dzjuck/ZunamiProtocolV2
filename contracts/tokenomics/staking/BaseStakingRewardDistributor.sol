//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';

import { IDistributor } from './IDistributor.sol';

abstract contract BaseStakingRewardDistributor is
    IDistributor,
    Initializable,
    ERC20PermitUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    error TokenAlreadyAdded();
    error ZeroAddress();
    error ZeroAmount();
    error WrongAmount();
    error ZeroSupply();
    error AbsentRewardToken();

    // Create a new role identifier for the distributor role
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256('DISTRIBUTOR_ROLE');

    uint256 public constant DISTRIBUTION_DENOMINATOR = 1e18;

    struct RewardTokenInfo {
        IERC20 token;
        uint256 balance;
        uint256 distribution;
    }

    IERC20 public token; // Address of token contract.

    // The reward token token infos
    RewardTokenInfo[] public rewardTokenInfo;
    mapping(address => uint256) public rewardTokenTidByAddress;

    // Accumulated rewards
    // tid => user => claimable balance
    mapping(uint256 => mapping(address => uint256)) public claimableRewards;

    // Claimed rewards
    // tid => user => claimed balance
    mapping(uint256 => mapping(address => uint256)) public claimedRewards;

    // claimant -> default reward receiver
    mapping(address => address) public rewardsReceiver;

    // Info of each user that stakes tokens.
    mapping(address => mapping(uint256 => uint256)) public userRewardDistribution;

    uint256 public totalAmount;

    event RewardTokenAdded(address indexed token, uint256 indexed tid);
    event RewardsReceiverSet(address indexed claimant, address indexed receiver);
    event Claimed(address indexed user, uint256 indexed tid, uint256 amount);
    event DistributionUpdated(uint256 indexed tid, uint256 distribution);
    event UserDistributionUpdated(uint256 indexed tid, address indexed user, uint256 distribution);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _token,
        string memory _name,
        string memory _symbol,
        address _defaultAdmin
    ) public virtual initializer {
        if (_token == address(0)) revert ZeroAddress();
        if (_defaultAdmin == address(0)) revert ZeroAddress();

        __ERC20_init(_name, _symbol);
        __ERC20Permit_init(_name);
        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);

        token = IERC20(_token);

        initializeExtension();
    }

    function initializeExtension() internal virtual {}

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function version() public pure returns (uint256) {
        return 1;
    }

    function addRewardToken(IERC20 _token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (address(_token) == address(0)) revert ZeroAddress();
        if (isRewardTokenAdded(address(_token))) revert TokenAlreadyAdded();

        uint256 tid = rewardTokenInfo.length;
        rewardTokenInfo.push(RewardTokenInfo({ token: _token, balance: 0, distribution: 0 }));
        rewardTokenTidByAddress[address(_token)] = tid;

        emit RewardTokenAdded(address(_token), tid);
    }

    function setRewardsReceiver(address _receiver) external {
        rewardsReceiver[msg.sender] = _receiver;
        emit RewardsReceiverSet(msg.sender, _receiver);
    }

    function _checkpointRewards(
        address _user,
        uint256[] memory _distributions,
        bool _claim,
        address _receiver
    ) internal {
        address receiver = _receiver;
        if (_claim && receiver == address(0)) {
            // if receiver is not explicitly declared, check for default reward receiver
            receiver = rewardsReceiver[_user];
            if (receiver == address(0)) {
                // direct claims to user if no default receiver is set
                receiver = _user;
            }
        }

        // calculate new user reward distribution and transfer any owed rewards
        uint256 userBalance = balanceOf(_user);
        uint256 length = rewardTokenInfo.length;
        for (uint256 i = 0; i < length; ++i) {
            _checkpointReward(i, _user, receiver, userBalance, _distributions[i], _claim);
        }
    }

    function _updateDistributions() internal returns (uint256[] memory) {
        uint256 length = rewardTokenInfo.length;
        uint256[] memory distributions = new uint256[](length);
        for (uint256 i = 0; i < length; ++i) {
            distributions[i] = _updateDistribution(i);
        }
        return distributions;
    }

    function _reduceByStakedAmount(
        uint256 _tokenBalance
    ) internal view virtual returns (uint256 reducedTokenBalance) {
        reducedTokenBalance = _tokenBalance - totalAmount;
    }

    function _checkpointReward(
        uint256 _tid,
        address _user,
        address _receiver,
        uint256 _userBalance,
        uint256 _distribution,
        bool _claim
    ) internal {
        uint256 userDistribution = userRewardDistribution[_user][_tid];
        uint256 newClaimable = 0;
        if (userDistribution < _distribution) {
            userRewardDistribution[_user][_tid] = _distribution;
            emit UserDistributionUpdated(_tid, _user, _distribution);
            newClaimable =
                (_userBalance * (_distribution - userDistribution)) /
                DISTRIBUTION_DENOMINATOR;
        }

        uint256 totalClaimable = claimableRewards[_tid][_user] + newClaimable;
        if (totalClaimable > 0) {
            if (_claim) {
                uint256 transferred = _safeRewardTransfer(
                    rewardTokenInfo[_tid].token,
                    _receiver,
                    totalClaimable
                );
                rewardTokenInfo[_tid].balance -= transferred;
                // update amount claimed
                claimedRewards[_tid][_user] += transferred;
                if (claimableRewards[_tid][_user] != 0 || totalClaimable > transferred) {
                    claimableRewards[_tid][_user] = totalClaimable - transferred;
                }
                emit Claimed(_receiver, _tid, totalClaimable);
            } else if (newClaimable > 0) {
                // update total_claimable
                claimableRewards[_tid][_user] = totalClaimable;
            }
        }
    }

    function _updateDistribution(uint256 _tid) internal returns (uint256 distribution) {
        RewardTokenInfo storage rewardInfo = rewardTokenInfo[_tid];
        address token_ = address(rewardInfo.token);
        uint256 dI = 0;
        uint256 totalSupply_ = totalSupply();
        if (totalSupply_ != 0) {
            uint256 tokenBalance = IERC20(token_).balanceOf(address(this));
            if (token_ == address(token)) {
                tokenBalance = _reduceByStakedAmount(tokenBalance);
            }
            if (tokenBalance > rewardInfo.balance) {
                dI =
                    (DISTRIBUTION_DENOMINATOR * (tokenBalance - rewardInfo.balance)) /
                    totalSupply_;
            }
            rewardInfo.balance = tokenBalance;
        }

        distribution = rewardInfo.distribution + dI;
        if (dI != 0) {
            rewardInfo.distribution = distribution;
            emit DistributionUpdated(_tid, distribution);
        }
    }

    // Distribute rewards
    function distribute(address _token, uint256 _amount) external onlyRole(DISTRIBUTOR_ROLE) {
        if (totalAmount == 0) revert ZeroSupply();
        if (_amount == 0) revert ZeroAmount();
        if (_token == address(0)) revert ZeroAddress();
        if (!isRewardTokenAdded(_token)) revert AbsentRewardToken();
        uint256 tid = rewardTokenTidByAddress[_token];

        rewardTokenInfo[tid].token.safeTransferFrom(msg.sender, address(this), _amount);
        _updateDistribution(tid);
    }

    // claim rewards
    function claim(address _receiver) external nonReentrant {
        uint256[] memory distributions = _updateDistributions();
        _checkpointRewards(msg.sender, distributions, true, _receiver);
    }

    // Safe rewardToken transfer function.
    function _safeRewardTransfer(
        IERC20 rewardToken,
        address _to,
        uint256 _amount
    ) internal returns (uint256 transferred) {
        uint256 balance = rewardToken.balanceOf(address(this));
        transferred = _amount;
        if (transferred > balance) {
            transferred = balance;
        }
        rewardToken.safeTransfer(_to, transferred);
    }

    // Number of reward tokens.
    function rewardTokenCount() external view returns (uint256) {
        return rewardTokenInfo.length;
    }

    function isRewardTokenAdded(address _token) public view returns (bool) {
        uint256 tid = rewardTokenTidByAddress[_token];
        if (
            tid > 0 || (rewardTokenInfo.length > 0 && address(rewardTokenInfo[tid].token) == _token)
        ) {
            return true;
        }
        return false;
    }

    function getPendingReward(uint256 _tid, address _user) external view returns (uint256) {
        uint256 newClaimable = 0;
        if (userRewardDistribution[_user][_tid] < rewardTokenInfo[_tid].distribution) {
            newClaimable =
                (balanceOf(_user) *
                    (rewardTokenInfo[_tid].distribution - userRewardDistribution[_user][_tid])) /
                DISTRIBUTION_DENOMINATOR;
        }

        return claimableRewards[_tid][_user] + newClaimable;
    }

    /**
     * @dev Allows the owner to withdraw emergency tokens from the contract.
     * @param _token The ERC20 token to withdraw from.
     * @notice Only the owner can withdraw tokens.
     */
    function withdrawEmergency(IERC20 _token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 tokenBalance = _token.balanceOf(address(this));
        if (tokenBalance > 0) {
            _token.safeTransfer(msg.sender, tokenBalance);
        }
    }

    function transfer(
        address recipient,
        uint256 amount
    ) public virtual override nonReentrant returns (bool) {
        return super.transfer(recipient, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override nonReentrant returns (bool) {
        return super.transferFrom(sender, recipient, amount);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override(ERC20Upgradeable) {
        if (value > 0) {
            uint256[] memory distributions = _updateDistributions();
            _checkpointRewards(from, distributions, false, address(0));
            _checkpointRewards(to, distributions, false, address(0));
        }
        super._update(from, to, value);
    }

    function nonces(
        address owner
    ) public view virtual override(ERC20PermitUpgradeable) returns (uint256) {
        return super.nonces(owner);
    }
}
