import { ethers } from 'hardhat';
import { ZunamiPool, ZunamiPoolThroughController } from '../../typechain-types';
import * as addrs from '../address.json';

export async function attachZunPoolAndController(
    zunPoolAddress: string,
    zunPoolContractName: string,
    zunPoolControllerAddress: string,
    zunPoolControllerContractName: string
) {
    const ZunamiPoolZunStableFactory = await ethers.getContractFactory(zunPoolContractName);
    const zunamiPool = (await ZunamiPoolZunStableFactory.attach(zunPoolAddress)) as ZunamiPool;

    const ZunamiPooControllerZunStableFactory = await ethers.getContractFactory(
      zunPoolControllerContractName
    );
    const zunamiPoolController = (await ZunamiPooControllerZunStableFactory.attach(
      zunPoolControllerAddress
    )) as ZunamiPoolThroughController;

    return { zunamiPool, zunamiPoolController };
}
