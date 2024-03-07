import { ethers } from 'hardhat';
import { BigNumber, BigNumberish } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ZunamiToken } from '../../typechain-types';

interface EIP712Domain {
    name: string;
    version: string;
    verifyingContract: string;
}

export async function getSignTypedData(
    signer: SignerWithAddress,
    token: ZunamiToken,
    spender: string,
    approveAmount: BigNumber | number,
    eip712Domain?: EIP712Domain
) {
    const deadline = ethers.constants.MaxUint256;
    const nonce = await token.nonces(signer.address);

    const chainId = (await ethers.provider.getNetwork()).chainId;

    const { name, version, verifyingContract } = eip712Domain || (await token.eip712Domain());
    const { v, r, s } = ethers.utils.splitSignature(
        await signer._signTypedData(
            {
                name,
                version,
                chainId,
                verifyingContract,
            },
            {
                Permit: [
                    {
                        name: 'owner',
                        type: 'address',
                    },
                    {
                        name: 'spender',
                        type: 'address',
                    },
                    {
                        name: 'value',
                        type: 'uint256',
                    },
                    {
                        name: 'nonce',
                        type: 'uint256',
                    },
                    {
                        name: 'deadline',
                        type: 'uint256',
                    },
                ],
            },
            {
                owner: signer.address,
                spender,
                value: approveAmount,
                nonce,
                deadline,
            }
        )
    );

    return { deadline, v, r, s };
}
