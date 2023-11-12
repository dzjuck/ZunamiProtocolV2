import { ethers } from 'hardhat';
import { IRewardManager, IStableConverter, INativeConverter } from '../../typechain-types';

export async function createConvertersAndRewardManagerContracts(
    stableConverterName: string,
    rewardManagerName: string
) {
    const StableConverterFactory = await ethers.getContractFactory(stableConverterName);
    const stableConverter = (await StableConverterFactory.deploy()) as IStableConverter;

    const SellingCurveRewardManagerFactory = await ethers.getContractFactory(rewardManagerName);
    const rewardManager = (await SellingCurveRewardManagerFactory.deploy(
        stableConverter.address
    )) as IRewardManager;

    const FraxEthNativeConverterFactory = await ethers.getContractFactory('FraxEthNativeConverter');
    const frxEthNativeConverter =
        (await FraxEthNativeConverterFactory.deploy()) as INativeConverter;

    return { stableConverter, rewardManager, frxEthNativeConverter };
}
