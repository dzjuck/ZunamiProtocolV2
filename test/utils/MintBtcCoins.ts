import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { mintTokenTo } from "./MintTokenTo";

const wBtcWalletOwnerAddr = "0x6daB3bCbFb336b29d06B9C793AEF7eaA57888922";
const tBtcWalletOwnerAddr = "0x84eA3907b9206427F45c7b2614925a2B86D12611";

export async function mintBtcCoins(admin: SignerWithAddress, wBtc, tBtc) {

  await mintTokenTo(
    admin.address,
    admin,
    wBtc.address,
    wBtcWalletOwnerAddr,
    ethers.utils.parseUnits("50", "8")
  );

  console.log('wBTC admin balance of:', await wBtc.balanceOf(admin.address));

  await mintTokenTo(
    admin.address,
    admin,
    tBtc.address,
    tBtcWalletOwnerAddr,
    ethers.utils.parseEther("50")
  );

  console.log('tBtc admin balance of:', await tBtc.balanceOf(admin.address));
}
