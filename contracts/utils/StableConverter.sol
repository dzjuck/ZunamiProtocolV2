//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import '../utils/Constants.sol';
import '../interfaces/IStableConverter.sol';
import '../interfaces/ICurvePool.sol';

contract StableConverter is IStableConverter {
    using SafeERC20 for IERC20;

    error WrongFromStable(address stable);
    error WrongToStable(address stable);
    error WrongSlippage();
    error BrokenSlippage();

    uint256 public constant SLIPPAGE_DENOMINATOR = 10_000;
    uint256 public constant DEFAULT_SLIPPAGE = 30; // 0.3%

    address[] public SUPPORTED_STABLES = [
        Constants.DAI_ADDRESS,
        Constants.USDC_ADDRESS,
        Constants.USDT_ADDRESS,
        Constants.ZUNUSD_ADDRESS
    ];

    ICurvePool public constant curve3Pool = ICurvePool(Constants.CRV_3POOL_ADDRESS);
    ICurvePool public constant usdtCrvUsdPool = ICurvePool(Constants.CRV_USDT_crvUSD_ADDRESS);
    ICurvePool public constant crvUsdZunUsdPool = ICurvePool(Constants.CRV_zunUSD_crvUSD_ADDRESS);

    mapping(address => int128) public curve3PoolStableIndex;

    mapping(address => int8) public stablesDecimals;

    constructor() {
        curve3PoolStableIndex[Constants.DAI_ADDRESS] = 0; //DAI
        curve3PoolStableIndex[Constants.USDC_ADDRESS] = 1; //USDC
        curve3PoolStableIndex[Constants.USDT_ADDRESS] = 2; //USDT

        stablesDecimals[Constants.DAI_ADDRESS] = 18;
        stablesDecimals[Constants.USDC_ADDRESS] = 6;
        stablesDecimals[Constants.USDT_ADDRESS] = 6;
        stablesDecimals[Constants.ZUNUSD_ADDRESS] = 18;
        stablesDecimals[Constants.CRVUSD_ADDRESS] = 18;
    }

    function isStableSupported(address stable) public view returns (bool) {
        return
            stable == SUPPORTED_STABLES[0] ||
            stable == SUPPORTED_STABLES[1] ||
            stable == SUPPORTED_STABLES[2] ||
            stable == SUPPORTED_STABLES[3];
    }

    function handle(address from, address to, uint256 amount, uint256 slippage) public {
        if (!isStableSupported(from)) revert WrongFromStable(from);
        if (!isStableSupported(to)) revert WrongToStable(to);

        if (amount == 0) return;

        if (
            (from == Constants.DAI_ADDRESS ||
                from == Constants.USDC_ADDRESS ||
                from == Constants.USDT_ADDRESS) &&
            (to == Constants.DAI_ADDRESS ||
                to == Constants.USDC_ADDRESS ||
                to == Constants.USDT_ADDRESS)
        ) {
            IERC20(from).safeIncreaseAllowance(address(curve3Pool), amount);
            curve3Pool.exchange(
                curve3PoolStableIndex[from],
                curve3PoolStableIndex[to],
                amount,
                applySlippage(amount, slippage, stablesDecimals[to] - stablesDecimals[from])
            );
        }

        if (from == Constants.USDT_ADDRESS && to == Constants.ZUNUSD_ADDRESS) {
            IERC20(Constants.USDT_ADDRESS).safeIncreaseAllowance(address(usdtCrvUsdPool), amount);
            usdtCrvUsdPool.exchange(
                0,
                1,
                amount,
                applySlippage(
                    amount,
                    slippage,
                    stablesDecimals[Constants.CRVUSD_ADDRESS] -
                        stablesDecimals[Constants.USDT_ADDRESS]
                )
            );

            uint256 crvUsdAmount = IERC20(Constants.CRVUSD_ADDRESS).balanceOf(address(this));
            IERC20(Constants.CRVUSD_ADDRESS).safeIncreaseAllowance(
                address(crvUsdZunUsdPool),
                crvUsdAmount
            );
            crvUsdZunUsdPool.exchange(0, 1, crvUsdAmount, applySlippage(amount, slippage, 0));
        }

        IERC20 to_ = IERC20(to);
        to_.safeTransfer(msg.sender, to_.balanceOf(address(this)));
    }

    function valuate(
        address from,
        address to,
        uint256 amount
    ) public view returns (uint256 valuation) {
        if (!isStableSupported(from)) revert WrongFromStable(from);
        if (!isStableSupported(to)) revert WrongToStable(to);

        if (amount == 0) return 0;
        valuation = curve3Pool.get_dy(
            curve3PoolStableIndex[from],
            curve3PoolStableIndex[to],
            amount
        );
        if (valuation < applySlippage(amount, 0, stablesDecimals[to] - stablesDecimals[from]))
            revert BrokenSlippage();
    }

    function applySlippage(
        uint256 amount,
        uint256 slippage,
        int8 decimalsDiff
    ) internal pure returns (uint256) {
        if (slippage > SLIPPAGE_DENOMINATOR) revert WrongSlippage();
        if (slippage == 0) slippage = DEFAULT_SLIPPAGE;
        uint256 value = (amount * (SLIPPAGE_DENOMINATOR - slippage));
        if (decimalsDiff < 0) {
            value = value / (10 ** uint8(decimalsDiff * (-1)));
        } else {
            value = value * (10 ** uint8(decimalsDiff));
        }
        return value / SLIPPAGE_DENOMINATOR;
    }
}
