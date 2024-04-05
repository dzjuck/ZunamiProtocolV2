import { ethers } from 'hardhat';
import { ZunamiPool, ZunamiPoolThroughController } from '../../typechain-types';
import * as addrs from '../address.json';

export async function attachPoolAndControllerZunETH(
    zunETHPoolAddress: string,
    zunETHPoolControllerAddress: string
) {
    const ZunamiPoolZunETHFactory = await ethers.getContractFactory('ZunamiPoolZunETH');
    const zunamiPool = (await ZunamiPoolZunETHFactory.attach(zunETHPoolAddress)) as ZunamiPool;

    const ZunamiPooControllerZunETHFactory = await ethers.getContractFactory(
        'ZunamiPoolControllerZunETH'
    );
    const zunamiPoolController = (await ZunamiPooControllerZunETHFactory.attach(
        zunETHPoolControllerAddress
    )) as ZunamiPoolThroughController;

    return { zunamiPool, zunamiPoolController };
}
