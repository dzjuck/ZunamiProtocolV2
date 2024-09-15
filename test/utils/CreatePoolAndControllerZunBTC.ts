import { ethers } from 'hardhat';
import {
    ZunamiPool,
    ZunamiPoolThroughController,
} from '../../typechain-types';
import * as addrs from '../address.json';

export async function createPoolAndControllerZunBTC() {
    const ZunamiPoolZunBTCFactory = await ethers.getContractFactory('ZunamiPoolZunBTC');
    const zunamiPool = (await ZunamiPoolZunBTCFactory.deploy()) as ZunamiPool;

    const ZunamiPooControllerZunBTCFactory = await ethers.getContractFactory(
        'ZunamiPoolControllerZunBTC'
    );
    const zunamiPoolController = (await ZunamiPooControllerZunBTCFactory.deploy(
        zunamiPool.address
    )) as ZunamiPoolThroughController;

    await zunamiPoolController.setRewardTokens([
        addrs.crypto.crv,
        addrs.crypto.cvx,
        addrs.crypto.fxs,
        addrs.crypto.sdt,
    ]);
    await zunamiPool.grantRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address);
    return { zunamiPool, zunamiPoolController };
}
