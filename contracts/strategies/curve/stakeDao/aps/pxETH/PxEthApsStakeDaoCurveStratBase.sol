//SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import '../../../../../utils/Constants.sol';
import '../../../../../interfaces/IController.sol';
import '../../../../../interfaces/IStableConverter.sol';
import '../EmergencyAdminStakeDaoCurveNStratBase.sol';
import '../../../../../interfaces/ICurvePool2.sol';
import '../../../../../interfaces/ITokenConverter.sol';

contract PxEthApsStakeDaoCurveStratBase is EmergencyAdminStakeDaoCurveNStratBase {
    using SafeERC20 for IERC20;

    error InsufficientAmount();

    uint256 constant ZUNAMI_STABLE_TOKEN_ID = 0;

    uint128 public constant PXETH_TOKEN_POOL_PXETH_ID = 1;
    int128 public constant PXETH_TOKEN_POOL_PXETH_ID_INT = int128(PXETH_TOKEN_POOL_PXETH_ID);

    uint128 public constant PXETH_TOKEN_POOL_TOKEN_ID = 0;
    int128 public constant PXETH_TOKEN_POOL_TOKEN_ID_INT = int128(PXETH_TOKEN_POOL_TOKEN_ID);

    IERC20 wEth = IERC20(Constants.WETH_ADDRESS);
    IERC20 frxEth = IERC20(Constants.FRX_ETH_ADDRESS);
    IERC20 pxEth = IERC20(Constants.PXETH_ADDRESS);

    IController public immutable zunamiController;
    IERC20 public immutable zunamiStable;

    ITokenConverter public converter;
    event SetTokenConverter(address tokenConverter);

    constructor(
        IERC20[POOL_ASSETS] memory _tokens,
        uint256[POOL_ASSETS] memory _tokenDecimalsMultipliers,
        address _vaultAddr,
        address _poolAddr,
        address _poolTokenAddr,
        address _zunamiControllerAddr,
        address _zunamiStableAddr
    )
        EmergencyAdminStakeDaoCurveNStratBase(
            _tokens,
            _tokenDecimalsMultipliers,
            _vaultAddr,
            _poolAddr,
            _poolTokenAddr
        )
    {
        if (_zunamiControllerAddr == address(0)) revert ZeroAddress();
        zunamiController = IController(_zunamiControllerAddr);

        if (_zunamiStableAddr == address(0)) revert ZeroAddress();
        zunamiStable = IERC20(_zunamiStableAddr);
    }

    function setTokenConverter(address converterAddr) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (address(converterAddr) == address(0)) revert ZeroAddress();
        converter = ITokenConverter(converterAddr);
        emit SetTokenConverter(converterAddr);
    }

    function getTokenPrice(address token) internal view override returns (uint256) {
        if (token == address(Constants.WETH_ADDRESS)) return 1e18;
        return
            (oracle.getUSDPrice(token) * 1e18) /
            oracle.getUSDPrice(Constants.CHAINLINK_FEED_REGISTRY_ETH_ADDRESS);
    }

    function convertCurvePoolTokenAmounts(
        uint256[POOL_ASSETS] memory amounts
    ) internal pure override returns (uint256[] memory) {
        uint256[] memory amountsN = new uint256[](CURVENG_MAX_COINS);
        amountsN[PXETH_TOKEN_POOL_TOKEN_ID] = amounts[ZUNAMI_STABLE_TOKEN_ID];
        return amountsN;
    }

    function convertAndApproveTokens(
        address pool,
        uint256[POOL_ASSETS] memory amounts
    ) internal override returns (uint256[] memory) {
        uint256[] memory amountsN = new uint256[](CURVENG_MAX_COINS);
        amountsN[PXETH_TOKEN_POOL_TOKEN_ID] = amounts[ZUNAMI_STABLE_TOKEN_ID];
        zunamiStable.safeIncreaseAllowance(pool, amountsN[PXETH_TOKEN_POOL_TOKEN_ID]);
        return amountsN;
    }

    function getCurveRemovingTokenIndex() internal pure override returns (int128) {
        return PXETH_TOKEN_POOL_TOKEN_ID_INT;
    }

    function getZunamiRemovingTokenIndex() internal pure override returns (uint256) {
        return ZUNAMI_STABLE_TOKEN_ID;
    }

    function _inflate(uint256 ratioOfCrvLps, uint256 minInflatedAmount) internal override {
        uint256 removingCrvLps = getLiquidityAmountByRatio(ratioOfCrvLps);
        depositedLiquidity -= removingCrvLps;
        vault.withdraw(removingCrvLps);

        uint256 pxEthAmount = pool.remove_liquidity_one_coin(
            removingCrvLps,
            PXETH_TOKEN_POOL_PXETH_ID_INT,
            0
        );

        if (pxEthAmount > 0) {
            pxEth.safeTransfer(address(converter), pxEthAmount);
            converter.handle(
                address(pxEth),
                address(wEth),
                pxEthAmount,
                applySlippage(pxEthAmount)
            );
        }

        uint256 wEthBalance = wEth.balanceOf(address(this));
        wEth.safeIncreaseAllowance(address(zunamiController), wEthBalance);

        uint256 zunStableAmount = zunamiController.deposit(
            [wEthBalance, 0, 0, 0, 0],
            address(this)
        );

        if (zunStableAmount < minInflatedAmount) {
            revert InsufficientAmount();
        }

        uint256[] memory amountsN = new uint256[](CURVENG_MAX_COINS);
        amountsN[PXETH_TOKEN_POOL_TOKEN_ID] = zunStableAmount;
        zunamiStable.safeIncreaseAllowance(address(pool), zunStableAmount);

        uint256 poolTokenAmount = depositCurve(amountsN);
        depositedLiquidity += poolTokenAmount;
        depositBooster(poolTokenAmount);
    }

    function _deflate(uint256 ratioOfCrvLps, uint256 minDeflateAmount) internal override {
        uint256 removingCrvLps = getLiquidityAmountByRatio(ratioOfCrvLps);
        depositedLiquidity -= removingCrvLps;
        vault.withdraw(removingCrvLps);

        uint256 tokenAmount = pool.remove_liquidity_one_coin(
            removingCrvLps,
            PXETH_TOKEN_POOL_TOKEN_ID_INT,
            0
        );

        zunamiStable.safeIncreaseAllowance(address(zunamiController), tokenAmount);
        zunamiController.withdraw(tokenAmount, [uint256(0), 0, 0, 0, 0], address(this));

        uint256 frxEthBalance = frxEth.balanceOf(address(this));
        if (frxEthBalance > 0) {
            frxEth.safeTransfer(address(converter), frxEthBalance);
            converter.handle(
                address(frxEth),
                address(wEth),
                frxEthBalance,
                applySlippage(frxEthBalance)
            );
        }

        uint256 wEthBalance = wEth.balanceOf(address(this));
        if (wEthBalance > 0) {
            wEth.safeTransfer(address(converter), wEthBalance);
            converter.handle(
                address(wEth),
                address(pxEth),
                wEthBalance,
                applySlippage(wEthBalance)
            );
        }

        uint256 pxEthAmount = pxEth.balanceOf(address(this));

        if (pxEthAmount < minDeflateAmount) {
            revert InsufficientAmount();
        }

        uint256[] memory amountsN = new uint256[](CURVENG_MAX_COINS);
        amountsN[PXETH_TOKEN_POOL_PXETH_ID] = pxEthAmount;
        pxEth.safeIncreaseAllowance(address(pool), pxEthAmount);

        uint256 poolTokenAmount = depositCurve(amountsN);
        depositedLiquidity += poolTokenAmount;
        depositBooster(poolTokenAmount);
    }
}
