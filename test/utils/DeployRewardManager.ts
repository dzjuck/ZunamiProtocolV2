import { ethers } from 'hardhat';
import {
    IRewardManager,
    IStableConverter,
    INativeConverter,
    ITokenConverter,
} from '../../typechain-types';

export async function deployRewardManager(tokenConverterAddress: string, oracleAddress: string) {
    const SellingCurveRewardManager2Factory = await ethers.getContractFactory(
        'SellingCurveRewardManager2'
    );
    return (await SellingCurveRewardManager2Factory.deploy(
        tokenConverterAddress,
        oracleAddress
    )) as IRewardManager;
}
