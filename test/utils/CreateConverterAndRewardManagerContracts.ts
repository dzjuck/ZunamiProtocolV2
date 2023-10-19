import { ethers } from 'hardhat';
import { SellingCurveRewardManager, StableConverter } from '../../typechain-types';

export async function createConverterAndRewardManagerContracts() {
    const StableConverterFactory = await ethers.getContractFactory('StableConverter');
    const stableConverter = (await StableConverterFactory.deploy()) as StableConverter;

    const SellingCurveRewardManagerFactory = await ethers.getContractFactory(
        'SellingCurveRewardManager'
    );
    const rewardManager = (await SellingCurveRewardManagerFactory.deploy(
        stableConverter.address
    )) as SellingCurveRewardManager;
    return { stableConverter, rewardManager };
}
