//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol';

import './interfaces/IPool.sol';
import './RewardTokenManager.sol';

abstract contract ZunamiPoolControllerBaseUpgradeable is
    UUPSUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable,
    RewardTokenManager
{
    using SafeERC20 for IERC20;

    error OnlyIssuer();
    error ZeroAddress();
    error WrongSid();

    bytes32 public constant ISSUER_ROLE = keccak256('ISSUER_ROLE');
    uint8 public constant POOL_ASSETS = 5;

    uint256 public defaultDepositSid;
    uint256 public defaultWithdrawSid;

    bool public onlyIssuerMode;

    IPool public pool;

    event SetDefaultDepositSid(uint256 sid);
    event SetDefaultWithdrawSid(uint256 sid);
    event RewardCollectorChanged(address oldRewardCollector, address newRewardCollector);
    event SetOnlyIssuerMode(bool onlyIssuerMode);

    modifier onlyIssuance() {
        if (onlyIssuerMode && !hasRole(ISSUER_ROLE, msg.sender)) revert OnlyIssuer();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function __ZunamiPoolControllerBase_init(
        address pool_
    ) internal onlyInitializing {
        if (pool_ == address(0)) revert ZeroAddress();
        pool = IPool(pool_);

        __UUPSUpgradeable_init();
        __Pausable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function version() public pure returns (uint256) {
        return 1;
    }

    function setOnlyIssuerMode(bool _onlyIssuerMode) external onlyRole(DEFAULT_ADMIN_ROLE) {
        onlyIssuerMode = _onlyIssuerMode;
        emit SetOnlyIssuerMode(onlyIssuerMode);
    }

    function setRewardTokens(IERC20[] memory rewardTokens_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setRewardTokens(rewardTokens_);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function setDefaultDepositSid(uint256 _newPoolId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_newPoolId >= pool.strategyCount()) revert WrongSid();

        defaultDepositSid = _newPoolId;
        emit SetDefaultDepositSid(_newPoolId);
    }

    function setDefaultWithdrawSid(uint256 _newPoolId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_newPoolId >= pool.strategyCount()) revert WrongSid();

        defaultWithdrawSid = _newPoolId;
        emit SetDefaultWithdrawSid(_newPoolId);
    }

    function claimPoolRewards(address collector) internal {
        pool.claimRewards(collector, rewardTokens);
    }

    function deposit(
        uint256[POOL_ASSETS] memory amounts,
        address receiver
    ) external whenNotPaused nonReentrant onlyIssuance returns (uint256 shares) {
        if (receiver == address(0)) {
            receiver = msg.sender;
        }

        IERC20[POOL_ASSETS] memory tokens = pool.tokens();
        for (uint256 i = 0; i < POOL_ASSETS; ++i) {
            IERC20 token = tokens[i];
            if (address(token) != address(0) && amounts[i] > 0) {
                tokens[i].safeTransferFrom(msg.sender, address(pool), amounts[i]);
            }
        }

        return depositPool(amounts, receiver);
    }

    function depositPool(
        uint256[POOL_ASSETS] memory amounts,
        address receiver
    ) internal virtual returns (uint256);

    function depositDefaultPool(
        uint256[POOL_ASSETS] memory amounts,
        address receiver
    ) internal returns (uint256) {
        return pool.deposit(defaultDepositSid, amounts, receiver);
    }

    function withdraw(
        uint256 shares,
        uint256[POOL_ASSETS] memory minTokenAmounts,
        address receiver
    ) external whenNotPaused nonReentrant onlyIssuance {
        if (receiver == address(0)) {
            receiver = msg.sender;
        }
        withdrawPool(msg.sender, shares, minTokenAmounts, receiver);
    }

    function withdrawDefaultPool(
        uint256 shares,
        uint256[POOL_ASSETS] memory minTokenAmounts,
        address receiver
    ) internal virtual {
        pool.withdraw(defaultWithdrawSid, shares, minTokenAmounts, receiver);
    }

    function withdrawPool(
        address user,
        uint256 shares,
        uint256[POOL_ASSETS] memory minTokenAmounts,
        address receiver
    ) internal virtual;
}
