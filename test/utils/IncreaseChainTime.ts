import { network } from 'hardhat';

export async function increaseChainTime(time: number) {
    await network.provider.send('evm_increaseTime', [time]);
    await network.provider.send('evm_mine');
}
