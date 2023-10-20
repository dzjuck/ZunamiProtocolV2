import { ethers } from 'hardhat';
import { IRewardManager, IStableConverter } from '../../typechain-types';

export async function createConverterAndRewardManagerContracts(
    stableConvertorName: string,
    rewardManagerName: string
) {
    const StableConverterFactory = await ethers.getContractFactory(stableConvertorName);
    const stableConverter = (await StableConverterFactory.deploy()) as IStableConverter;

    const SellingCurveRewardManagerFactory = await ethers.getContractFactory(rewardManagerName);
    const rewardManager = (await SellingCurveRewardManagerFactory.deploy(
        stableConverter.address
    )) as IRewardManager;
    return { stableConverter, rewardManager };
}
