//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import '../lib/Oracle/interfaces/IOracle.sol';
import '../interfaces/IStrategy.sol';
import './ZunamiPoolAccessControl.sol';

abstract contract ZunamiStratBase is IStrategy, ZunamiPoolAccessControl {
    using SafeERC20 for IERC20;

    error WrongTokens();
    error WrongDecimalMultipliers();
    error DepositLiquidityValueTooLow();

    uint8 public constant POOL_ASSETS = 5;
    uint256 public constant RATIO_MULTIPLIER = 1e18;
    uint256 public constant PRICE_DENOMINATOR = 1e18;

    uint256 public constant SLIPPAGE_DENOMINATOR = 10000;
    uint256 public slippage = 50; // 0.50%

    IERC20[POOL_ASSETS] public tokens;
    uint256[POOL_ASSETS] public tokenDecimalsMultipliers;
    IOracle public oracle;

    uint256 public depositedLiquidity;

    event SlippageSet(uint256 oldSlippage, uint256 newSlippage);
    event PriceOracleSet(address oracleAddr);

    error WrongSlippage();
    error WrongRatio();

    constructor(
        IERC20[POOL_ASSETS] memory tokens_,
        uint256[POOL_ASSETS] memory tokenDecimalsMultipliers_
    ) {
        bool otherZeros = false;
        for (uint256 i = 0; i < POOL_ASSETS; ++i) {
            if (otherZeros && address(tokens_[i]) != address(0)) revert WrongTokens();
            if (address(tokens_[i]) == address(0)) otherZeros = true;
            if (
                (address(tokens_[i]) != address(0) && tokenDecimalsMultipliers_[i] == 0) ||
                (address(tokens_[i]) == address(0) && tokenDecimalsMultipliers_[i] != 0)
            ) revert WrongDecimalMultipliers();
        }

        tokens = tokens_;
        tokenDecimalsMultipliers = tokenDecimalsMultipliers_;
    }

    function setPriceOracle(address oracleAddr) public onlyRole(DEFAULT_ADMIN_ROLE) {
        if (oracleAddr == address(0)) revert ZeroAddress();

        oracle = IOracle(oracleAddr);
        emit PriceOracleSet(oracleAddr);
    }

    function setSlippage(uint256 _slippage) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!(_slippage > 0 && _slippage <= SLIPPAGE_DENOMINATOR)) revert WrongSlippage();
        emit SlippageSet(slippage, _slippage);
        slippage = _slippage;
    }

    function applySlippageDifferentPrice(
        uint256 amount,
        address tokenIn,
        address tokenOut
    ) internal view returns (uint256) {
        return
            (amount * getTokenPrice(tokenIn) * (SLIPPAGE_DENOMINATOR - slippage)) /
            SLIPPAGE_DENOMINATOR /
            getTokenPrice(tokenOut);
    }

    function applySlippage(uint256 amount) internal view returns (uint256) {
        return (amount * (SLIPPAGE_DENOMINATOR - slippage)) / SLIPPAGE_DENOMINATOR;
    }

    function calcTokenAmount(
        uint256[POOL_ASSETS] memory tokenAmounts,
        bool isDeposit
    ) public view virtual returns (uint256 sharesAmount);

    function calcLiquidityValue(uint256 tokenAmount) internal view returns (uint256) {
        return (tokenAmount * getLiquidityTokenPrice()) / PRICE_DENOMINATOR;
    }

    function getLiquidityTokenPrice() internal view virtual returns (uint256);

    function getTokenPrice(address token) internal view virtual returns (uint256) {
        return oracle.getUSDPrice(token);
    }

    function totalHoldings() public view virtual returns (uint256) {
        return calcLiquidityValue(getLiquidityBalance());
    }

    function getLiquidityBalance() internal view virtual returns (uint256) {
        return depositedLiquidity;
    }

    function deposit(
        uint256[POOL_ASSETS] memory amounts
    ) external onlyZunamiPool returns (uint256 liquidityValue) {
        uint256 depositValue = valuateDeposit(amounts);
        uint256 liquidity = depositLiquidity(amounts);
        depositedLiquidity += liquidity;
        liquidityValue = calcLiquidityValue(liquidity);
        if (liquidityValue < applySlippage(depositValue)) revert DepositLiquidityValueTooLow();
    }

    function valuateDeposit(
        uint256[POOL_ASSETS] memory amounts
    ) internal view virtual returns (uint256 value) {
        for (uint256 i = 0; i < POOL_ASSETS; ++i) {
            value +=
                (getTokenPrice(address(tokens[i])) * amounts[i] * tokenDecimalsMultipliers[i]) /
                PRICE_DENOMINATOR;
        }
        return value;
    }

    function depositLiquidity(
        uint256[POOL_ASSETS] memory amounts
    ) internal virtual returns (uint256);

    function getLiquidityAmountByRatio(
        uint256 poolTokenRatio // multiplied by 1e18
    ) internal view returns (uint256) {
        require(poolTokenRatio > 0 && poolTokenRatio <= RATIO_MULTIPLIER, 'Wrong PoolToken Ratio');
        if (!(poolTokenRatio > 0 && poolTokenRatio <= RATIO_MULTIPLIER)) revert WrongRatio();
        return (getLiquidityBalance() * poolTokenRatio) / RATIO_MULTIPLIER;
    }

    function withdraw(
        address receiver,
        uint256 poolTokenRatio, // multiplied by 1e18
        uint256[POOL_ASSETS] memory tokenAmounts
    ) external virtual onlyZunamiPool returns (bool) {
        uint256 liquidityAmount = getLiquidityAmountByRatio(poolTokenRatio);

        if (liquidityAmount < calcTokenAmount(tokenAmounts, false)) {
            return false;
        }

        uint256[] memory prevBalances = new uint256[](POOL_ASSETS);
        for (uint256 i = 0; i < POOL_ASSETS; ++i) {
            if (address(tokens[i]) == address(0)) break;
            prevBalances[i] = tokens[i].balanceOf(address(this));
        }

        depositedLiquidity -= liquidityAmount;
        removeLiquidity(liquidityAmount, tokenAmounts, false);

        transferTokensOut(convertTokensToDynamic(tokens), receiver, prevBalances);

        return true;
    }

    function removeLiquidity(
        uint256 amount,
        uint256[POOL_ASSETS] memory minTokenAmounts,
        bool removeAll
    ) internal virtual;

    function claimRewards(
        address receiver,
        IERC20[] memory rewardTokens
    ) public virtual onlyZunamiPool {
        claimCollectedRewards();
        transferTokensOut(rewardTokens, receiver, fillArrayN(0, rewardTokens.length));
    }

    function claimCollectedRewards() internal virtual {}

    function withdrawAll(
        uint256[POOL_ASSETS] memory minTokenAmounts
    ) external virtual onlyZunamiPool {
        removeLiquidity(depositedLiquidity, minTokenAmounts, true);
        depositedLiquidity = 0;
        transferTokensOut(convertTokensToDynamic(tokens), msg.sender, fillArrayN(0, POOL_ASSETS));
    }

    function transferTokensOut(
        IERC20[] memory transferringTokens,
        address receiver,
        uint256[] memory prevBalances
    ) internal {
        uint256 transferAmount;
        IERC20 token_;
        for (uint256 i = 0; i < transferringTokens.length; ++i) {
            token_ = transferringTokens[i];
            if (address(token_) == address(0)) break;
            transferAmount = token_.balanceOf(address(this)) - prevBalances[i];
            if (transferAmount > 0) {
                token_.safeTransfer(receiver, transferAmount);
            }
        }
    }

    function convertTokensToDynamic(
        IERC20[POOL_ASSETS] memory _tokens
    ) internal pure returns (IERC20[] memory tokesDynamic) {
        tokesDynamic = new IERC20[](POOL_ASSETS);
        for (uint256 i = 0; i < _tokens.length; ++i) {
            tokesDynamic[i] = _tokens[i];
        }
    }

    function fillArrayN(
        uint256 _value,
        uint256 _count
    ) internal pure returns (uint256[] memory values) {
        values = new uint256[](_count);
        for (uint256 i = 0; i < _count; ++i) {
            values[i] = _value;
        }
    }

    function withdrawEmergency(IERC20 _token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 tokenBalance = _token.balanceOf(address(this));
        if (tokenBalance > 0) {
            _token.safeTransfer(msg.sender, tokenBalance);
        }
    }
}
