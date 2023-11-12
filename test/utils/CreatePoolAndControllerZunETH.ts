import { ethers } from 'hardhat';
import { ZunamiPoolBaseController, ZunamiPool } from '../../typechain-types';
import * as addrs from '../address.json';

export async function createPoolAndControllerZunETH() {
    const ZunamiPoolZunETHFactory = await ethers.getContractFactory('ZunamiPoolZunETH');
    const zunamiPool = (await ZunamiPoolZunETHFactory.deploy()) as ZunamiPool;

    const ZunamiPooControllerZunETHFactory = await ethers.getContractFactory(
        'ZunamiPooControllerZunETH'
    );
    const zunamiPoolController = (await ZunamiPooControllerZunETHFactory.deploy(
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
