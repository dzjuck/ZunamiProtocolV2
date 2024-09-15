import { ethers } from "hardhat";
import { IRewardManager, ITokenConverter } from "../../../typechain-types";

export async function createRewardManager(genericOracleAddr: string) {
  const curveRouter = "0xF0d4c12A5768D806021F80a262B4d39d26C58b8D";
  const TokenConverterFactory = await ethers.getContractFactory("TokenConverter");
  const tokenConverter = (await TokenConverterFactory.deploy(curveRouter)) as ITokenConverter;

  const SellingCurveRewardManagerFactory = await ethers.getContractFactory("SellingCurveRewardManager2");
  const rewardManager = (await SellingCurveRewardManagerFactory.deploy(
    tokenConverter.address,
    genericOracleAddr
  )) as IRewardManager;
  return { tokenConverter, rewardManager };
}
