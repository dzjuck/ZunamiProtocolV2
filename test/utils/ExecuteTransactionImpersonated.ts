import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Signer } from "ethers";
import { ethers, network } from "hardhat";

export async function executeTransactionImpersonated(
  admin: SignerWithAddress,
  signerAddress: string,
  executeTransaction: (signer: Signer) => Promise<void>
) {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [signerAddress]
  });

  const signer: Signer = ethers.provider.getSigner(signerAddress);

  await admin.sendTransaction({
    to: signerAddress,
    value: ethers.utils.parseEther("1.0")
  });

  await executeTransaction(signer);

  await network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [signerAddress]
  });
}
