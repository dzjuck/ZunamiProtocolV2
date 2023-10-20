import { ethers } from 'hardhat';
import { ZunamiPoolBaseController, ZunamiPool } from '../../typechain-types';
import * as addrs from '../address.json';

export async function createPoolAndControllerUZD() {
    const ZunamiPoolUZDFactory = await ethers.getContractFactory('ZunamiPoolUZD');
    const zunamiPool = (await ZunamiPoolUZDFactory.deploy()) as ZunamiPool;

    const ZunamiPooControllerUZDFactory = await ethers.getContractFactory('ZunamiPooControllerUZD');
    const zunamiPoolController = (await ZunamiPooControllerUZDFactory.deploy(
        zunamiPool.address
    )) as ZunamiPoolBaseController;

    await zunamiPoolController.setRewardTokens([
        addrs.crypto.crv,
        addrs.crypto.cvx,
        addrs.crypto.fxs,
        addrs.crypto.sdt,
    ]);
    await zunamiPool.grantRole(await zunamiPool.CONTROLLER_ROLE(), zunamiPoolController.address);
    return { zunamiPool, zunamiPoolController };
}
