import {BigNumber, Signer} from "ethers";
import {ethers, network} from "hardhat";
import {abi as erc20ABI} from "../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json";
import { executeTransactionImpersonated } from "./ExecuteTransactionImpersonated";

export async function mintTokenTo(
  receiverAddr: string,
  ethVault: Signer,
  tokenAddr: string,
  tokenVaultAddr: string,
  tokenAmount: BigNumber
) {
  const token = new ethers.Contract(tokenAddr, erc20ABI, ethVault);
  await executeTransactionImpersonated(ethVault, tokenVaultAddr, async (tokenVaultSigner: Signer) => {
    await token.connect(tokenVaultSigner).transfer(receiverAddr, tokenAmount);
  });
}
