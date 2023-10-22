//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/utils/Pausable.sol';
import '@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';

import './interfaces/IPool.sol';
import './interfaces/IRewardManager.sol';
import './ZunamiPoolControllerBase.sol';

contract ZunamiPoolCompoundController is ERC20, ERC20Permit, ZunamiPoolControllerBase {
    using SafeERC20 for IERC20Metadata;

    error WrongFee();
    error FeeMustBeWithdrawn();

    uint256 public constant FEE_DENOMINATOR = 1000;
    uint256 public constant MAX_FEE = 300; // 30%

    uint256 public managementFee = 100; // 10%

    uint256 public feeTokenId;
    address public feeDistributor;

    uint256 public managementFees = 0;

    IRewardManager public rewardManager;

    event ManagementFeeSet(uint256 oldManagementFee, uint256 newManagementFee);
    event FeeDistributorChanged(address oldFeeDistributor, address newFeeDistributor);
    event SetFeeTokenId(uint256 tid);
    event SetRewardManager(address rewardManager);
    event ClaimedManagementFee(address feeToken, uint256 feeValue);
    event AutoCompoundedAll(uint256 compoundedValue);
    event Deposited(address indexed receiver, uint256 assets, uint256 shares, uint256 sid);
    event Withdrawn(address indexed withdrawer, uint256 shares, uint256 assets, uint256 sid);

    constructor(
        address pool_,
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) ERC20Permit(name_) ZunamiPoolControllerBase(pool_) {
        feeDistributor = msg.sender;
    }

    function setRewardManager(address rewardManagerAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (rewardManagerAddr == address(0)) revert ZeroAddress();

        rewardManager = IRewardManager(rewardManagerAddr);
        emit SetRewardManager(rewardManagerAddr);
    }

    function setManagementFee(uint256 newManagementFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newManagementFee > MAX_FEE) revert WrongFee();
        emit ManagementFeeSet(managementFee, newManagementFee);
        managementFee = newManagementFee;
    }

    function setFeeTokenId(uint256 _tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (managementFees != 0) revert FeeMustBeWithdrawn();

        feeTokenId = _tokenId;
        emit SetFeeTokenId(_tokenId);
    }

    function changeFeeDistributor(address _feeDistributor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit FeeDistributorChanged(feeDistributor, _feeDistributor);
        feeDistributor = _feeDistributor;
    }

    function claimManagementFee() external {
        IERC20Metadata feeToken_ = IERC20Metadata(pool.tokens()[feeTokenId]);
        uint256 managementFees_ = managementFees;
        uint256 feeTokenBalance = feeToken_.balanceOf(address(this));
        uint256 transferBalance = managementFees_ > feeTokenBalance
            ? feeTokenBalance
            : managementFees_;
        if (transferBalance > 0) {
            feeToken_.safeTransfer(feeDistributor, transferBalance);
        }
        managementFees = 0;

        emit ClaimedManagementFee(address(feeToken_), transferBalance);
    }

    function autoCompoundAll() external {
        claimPoolRewards(address(this));

        sellRewards();

        IERC20Metadata feeToken = pool.tokens()[feeTokenId];
        uint256[POOL_ASSETS] memory amounts;
        amounts[feeTokenId] = feeToken.balanceOf(address(this)) - managementFees;
        feeToken.safeTransfer(address(pool), amounts[feeTokenId]);

        uint256 depositedValue = pool.deposit(defaultDepositSid, amounts, address(this));

        emit AutoCompoundedAll(depositedValue);
    }

    function sellRewards() internal virtual {
        uint256 rewardsLength_ = rewardTokens.length;
        uint256[] memory rewardBalances = new uint256[](rewardsLength_);
        bool allRewardsEmpty = true;

        for (uint256 i = 0; i < rewardsLength_; i++) {
            rewardBalances[i] = rewardTokens[i].balanceOf(address(this));
            if (rewardBalances[i] > 0) {
                allRewardsEmpty = false;
            }
        }
        if (allRewardsEmpty) {
            return;
        }

        IERC20Metadata feeToken_ = pool.tokens()[feeTokenId];
        uint256 feeTokenBalanceBefore = feeToken_.balanceOf(address(this));

        IRewardManager rewardManager_ = rewardManager;
        IERC20Metadata rewardToken_;
        for (uint256 i = 0; i < rewardsLength_; i++) {
            if (rewardBalances[i] == 0) continue;
            rewardToken_ = rewardTokens[i];
            rewardToken_.safeTransfer(address(rewardManager_), rewardBalances[i]);
            rewardManager_.handle(address(rewardToken_), rewardBalances[i], address(feeToken_));
        }

        uint256 feeTokenBalanceAfter = feeToken_.balanceOf(address(this));

        managementFees += calcManagementFee(feeTokenBalanceAfter - feeTokenBalanceBefore);
    }

    function calcManagementFee(uint256 amount) internal view returns (uint256) {
        return (amount * managementFee) / FEE_DENOMINATOR;
    }

    function tokenPrice() public view returns (uint256) {
        return calcTokenPrice(pool.totalHoldings(), totalSupply());
    }

    function calcTokenPrice(uint256 _holdings, uint256 _tokens) public pure returns (uint256) {
        return (_holdings * 1e18) / _tokens;
    }

    function depositPool(
        uint256[POOL_ASSETS] memory amounts,
        address receiver
    ) internal override returns (uint256 shares) {
        uint256 stableBefore = pool.balanceOf(address(this));

        uint256 assets = super.depositPool(amounts, address(this));

        if (totalSupply() == 0) {
            shares = assets;
        } else {
            shares = (totalSupply() * assets) / stableBefore;
        }

        _mint(receiver, shares);
        emit Deposited(receiver, assets, shares, defaultDepositSid);
    }

    function withdrawPool(
        address user,
        uint256 shares,
        uint256[POOL_ASSETS] memory minTokenAmounts,
        address receiver
    ) internal override {
        uint256 assets = (pool.balanceOf(address(this)) * shares) / totalSupply();
        super.withdrawPool(user, assets, minTokenAmounts, receiver);
        _burn(user, shares);
        emit Withdrawn(user, shares, assets, defaultWithdrawSid);
    }
}
