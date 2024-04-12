// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable2Step.sol';

import '../../libraries/ScaledMath.sol';
import '../../libraries/CurvePoolUtils.sol';
import '../../interfaces/IOracle.sol';
import '../../interfaces/vendor/ICurvePoolV1.sol';

contract StaticCurveLPOracle is IOracle, Ownable2Step {
    using ScaledMath for uint256;

    error ZeroAddress();
    error LengthMismatch();
    error ZeroPool();
    error TokenNotSupported();
    error ZeroPrice();
    error ZeroBalance();
    error ThresholdTooHigh();

    event ImbalanceThresholdUpdated(address indexed token, uint256 threshold);

    uint256 internal constant _MAX_IMBALANCE_THRESHOLD = 0.1e18;
    mapping(address => uint256) public imbalanceThresholds;

    IOracle private immutable _genericOracle;
    address[] public coins;
    uint256[] public decimals;
    address public pool;

    constructor(address genericOracle_, address[] memory coins_, uint256[] memory decimals_, address pool_) Ownable(msg.sender) {
        if (genericOracle_ == address(0)) revert ZeroAddress();
        _genericOracle = IOracle(genericOracle_);

        if (coins_.length != decimals_.length) revert LengthMismatch();

        coins = coins_;
        decimals = decimals_;

        if(pool_ == address(0)) revert ZeroPool();
        pool = pool_;
    }

    function isTokenSupported(address token) external view override returns (bool) {
        if (token != pool) return false;
        uint256 numberOfCoins = coins.length;
        for (uint256 i; i < numberOfCoins; ++i) {
            if (!_genericOracle.isTokenSupported(coins[i])) return false;
        }
        return true;
    }

    function getUSDPrice(address token) external view returns (uint256) {
        if (token != pool) revert TokenNotSupported();

        // Adding up the USD value of all the coins in the pool
        uint256 value;
        uint256 numberOfCoins = coins.length;
        uint256[] memory prices = new uint256[](numberOfCoins);
        uint256[] memory thresholds = new uint256[](numberOfCoins);
        for (uint256 i; i < numberOfCoins; ++i) {
            address coin = coins[i];
            uint256 price = _genericOracle.getUSDPrice(coin);
            prices[i] = price;
            thresholds[i] = imbalanceThresholds[token];
            if (price == 0) revert ZeroPrice();
            uint256 balance = _getBalance(pool, i);
            if (balance == 0) revert ZeroBalance();
            value += balance.convertScale(uint8(decimals[i]), 18).mulDown(price);
        }

        // Verifying the pool is balanced
        CurvePoolUtils.ensurePoolBalanced(
            CurvePoolUtils.PoolMeta({
                pool: pool,
                numberOfCoins: numberOfCoins,
                assetType: CurvePoolUtils.AssetType.USD,
                decimals: decimals,
                prices: prices,
                thresholds: thresholds
            })
        );

        // Returning the value of the pool in USD per LP Token
        return value.divDown(IERC20(token).totalSupply());
    }

    function setImbalanceThreshold(address token, uint256 threshold) external onlyOwner {
        if (threshold > _MAX_IMBALANCE_THRESHOLD) revert ThresholdTooHigh();
        imbalanceThresholds[token] = threshold;
        emit ImbalanceThresholdUpdated(token, threshold);
    }

    function _getBalance(address curvePool, uint256 index) internal view returns (uint256) {
        return ICurvePoolV1(curvePool).balances(index);
    }
}
