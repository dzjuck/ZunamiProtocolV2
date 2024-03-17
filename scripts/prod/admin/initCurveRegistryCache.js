const { ethers } = require('hardhat');

const crvUSD_USDT_pool_addr = '0x390f3595bca2df7d23783dfd126427cceb997bf4';
const crvUSD_USDC_pool_addr = '0x4dece678ceceb27446b35c672dc7d61f30bad69e';
const stETH_ETH_pool_addr = '0x21E27a5E5513D6e65C4f830167390997aA84843a';
async function main() {
    // const curvePools = [crvUSD_USDT_pool_addr, crvUSD_USDC_pool_addr];
    const curvePools = [stETH_ETH_pool_addr];

    const curveRegistryCacheAddress = '0x2E68bE71687469280319BCf9E635a8783Db5d238';

    const curveRegistryCache = await ethers.getContractAt(
        'CurveRegistryCache',
        curveRegistryCacheAddress
    );
    console.log('CurveRegistryCache attached to:', curveRegistryCache.address);

    for (const curvePool of curvePools) {
        await curveRegistryCache.initPool(curvePool);
        console.log('CurveRegistryCache initialized with:', curvePool);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
