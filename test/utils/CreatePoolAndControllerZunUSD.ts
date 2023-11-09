import { ethers } from 'hardhat';
import { ZunamiPoolBaseController, ZunamiPool } from '../../typechain-types';
import * as addrs from '../address.json';

export async function createPoolAndControllerZunUSD() {
    const ZunamiPoolZunUSDFactory = await ethers.getContractFactory('ZunamiPoolZunUSD');
    const zunamiPool = (await ZunamiPoolZunUSDFactory.deploy()) as ZunamiPool;

    const ZunamiPooControllerZunUSDFactory = await ethers.getContractFactory('ZunamiPooControllerZunUSD');
    const zunamiPoolController = (await ZunamiPooControllerZunUSDFactory.deploy(
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
