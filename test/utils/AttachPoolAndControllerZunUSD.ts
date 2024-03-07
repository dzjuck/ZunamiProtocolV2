import { ethers } from 'hardhat';
import { ZunamiPool, ZunamiPoolThroughController } from '../../typechain-types';
import * as addrs from '../address.json';

export async function attachPoolAndControllerZunUSD(
  zunUSDPoolAddress: string,
  zunUSDPoolControllerAddress: string
) {
    const ZunamiPoolZunUSDFactory = await ethers.getContractFactory('ZunamiPoolZunUSD');
    const zunamiPool = (await ZunamiPoolZunUSDFactory.attach(zunUSDPoolAddress)) as ZunamiPool;

    const ZunamiPooControllerZunUSDFactory = await ethers.getContractFactory(
        'ZunamiPoolControllerZunUSD'
    );
    const zunamiPoolController = (await ZunamiPooControllerZunUSDFactory.attach(
      zunUSDPoolControllerAddress
    )) as ZunamiPoolThroughController;

    return { zunamiPool, zunamiPoolController };
}
