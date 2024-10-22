// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import { Math } from '@openzeppelin/contracts/utils/math/Math.sol';
import { Ownable2Step, Ownable } from '@openzeppelin/contracts/access/Ownable2Step.sol';
import { IERC20 } from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import { SafeERC20 } from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import { IGauge } from '../../../interfaces/IGauge.sol';
import { IVotemarket } from '../../../interfaces/IVotemarket.sol';
import { ICurveGaugeController } from '../../../interfaces/ICurveGaugeController.sol';
import { IOracle } from '../../../lib/Oracle/interfaces/IOracle.sol';
import { ICRV } from '../../../interfaces/ICRV.sol';
import { ICurvePriceOracle } from '../../../lib/Oracle/interfaces/ICurvePriceOracle.sol';

contract VotemarketGauge2 is IGauge, Ownable2Step {
    using SafeERC20 for IERC20;

    error ZeroAddress();
    error InvalidBountyRewardToken(address token, address bountyRewardToken);
    error ZeroMaxPricePerVote();

    event ZeroDistributionAmount();
    event WithdrawnEmergency(address token, uint256 amount);
    event SetAdditionalPeriods(uint8 additionalPeriods);
    event SetGenericOracle(address _genericOracle);
    event UpdatedManager(address newManager);
    event VotemarketIncreasedBountyDuration(
        uint256 bountyId,
        uint8 additionnalPeriods,
        uint256 increasedAmount,
        uint256 newMaxPricePerVote
    );
    event VotemarketIncreaseBountyDurationFailed();

    ICurveGaugeController internal constant _CURVE_GAUGE_CONTROLLER =
        ICurveGaugeController(0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB);
    ICRV internal constant _CRV = ICRV(0xD533a949740bb3306d119CC777fa900bA034cd52);
    address internal constant _ZUN_WETH_POOL = address(0x9dBcfC09E651c040EE68D6DbEB8a09F8dd0cAA77);
    address internal constant _WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    uint256 internal constant _WEEK = 604800;

    // https://votemarket.stakedao.org/
    IVotemarket public immutable VOTEMARKET;
    IERC20 public immutable TOKEN;
    uint256 public immutable BOUNTY_ID;

    IOracle public genericOracle;
    uint8 public additionalPeriods = 1;

    constructor(address _votemarket, address _token, uint256 _bountyId, address _genericOracle) Ownable(msg.sender) {
        _assertNonZero(_votemarket);
        VOTEMARKET = IVotemarket(_votemarket);

        _assertNonZero(_token);
        TOKEN = IERC20(_token);

        IVotemarket.Bounty memory bounty = VOTEMARKET.getBounty(_bountyId);
        if (bounty.rewardToken != _token)
            revert InvalidBountyRewardToken(_token, bounty.rewardToken);
        BOUNTY_ID = _bountyId;

        _assertNonZero(_genericOracle);
        genericOracle = IOracle(_genericOracle);
    }

    function distribute(uint256 _amount) external {
        if (_amount == 0) {
            emit ZeroDistributionAmount();
            return;
        }

        uint256 maxPricePerVote = getMaxPricePerVote();
        if (maxPricePerVote == 0) revert ZeroMaxPricePerVote();

        TOKEN.safeIncreaseAllowance(address(VOTEMARKET), _amount);
        try
            VOTEMARKET.increaseBountyDuration(
                BOUNTY_ID,
                additionalPeriods,
                _amount,
                maxPricePerVote
            )
        {} catch {
            emit VotemarketIncreaseBountyDurationFailed();
            return;
        }

        emit VotemarketIncreasedBountyDuration(
            BOUNTY_ID,
            additionalPeriods,
            _amount,
            maxPricePerVote
        );
    }

    function withdrawEmergency(IERC20 _token) external onlyOwner {
        _assertNonZero(address(_token));

        uint256 tokenBalance = _token.balanceOf(address(this));
        if (tokenBalance > 0) {
            _token.safeTransfer(msg.sender, tokenBalance);
        }

        emit WithdrawnEmergency(address(_token), tokenBalance);
    }

    function setAdditionalPeriods(uint8 _additionalPeriods) external onlyOwner {
        additionalPeriods = _additionalPeriods;

        emit SetAdditionalPeriods(_additionalPeriods);
    }

    function setGenericOracle(address _genericOracle) external onlyOwner {
        _assertNonZero(_genericOracle);

        genericOracle = IOracle(_genericOracle);

        emit SetGenericOracle(_genericOracle);
    }

    function getMaxPricePerVote() public view returns (uint256) {
        uint256 crvPrice = genericOracle.getUSDPrice(address(_CRV));
        uint256 crvRate = _CRV.rate();
        uint256 totalWeight = _CURVE_GAUGE_CONTROLLER.get_total_weight() / 1e18;
        uint256 zunPrice = getZunPrice();

        uint256 crvPerVeCrv = Math.mulDiv(crvRate * 1e18, _WEEK, totalWeight);

        return Math.mulDiv(crvPerVeCrv, crvPrice, zunPrice);
    }

    function getZunPrice() public view returns (uint256) {
        uint256 zunWethPrice = ICurvePriceOracle(_ZUN_WETH_POOL).price_oracle();
        uint256 wETHPrice = genericOracle.getUSDPrice(_WETH);

        return Math.mulDiv(zunWethPrice, wETHPrice, 1e18);
    }

    function updateManager(address _manager) external onlyOwner {
        VOTEMARKET.updateManager(BOUNTY_ID, _manager);

        emit UpdatedManager(_manager);
    }

    function _assertNonZero(address _address) internal pure {
        if (_address == address(0)) revert ZeroAddress();
    }
}
