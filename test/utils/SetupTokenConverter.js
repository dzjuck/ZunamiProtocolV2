const addresses = require('../address.json');

async function setupTokenConverterStables(tokenConverter) {
    const tokenIns = [
        addresses.stablecoins.usdt,
        addresses.stablecoins.usdt,
        addresses.stablecoins.usdt,
        addresses.stablecoins.usdt,

        addresses.stablecoins.usdc,
        addresses.stablecoins.usdc,
        addresses.stablecoins.usdc,
        addresses.stablecoins.usdc,

        addresses.stablecoins.dai,
        addresses.stablecoins.dai,
        addresses.stablecoins.dai,
        addresses.stablecoins.dai,

        addresses.stablecoins.crvUSD,
        addresses.stablecoins.crvUSD,
        addresses.stablecoins.crvUSD,
        addresses.stablecoins.crvUSD,
    ];
    const tokenOuts = [
        addresses.stablecoins.usdc,
        addresses.stablecoins.dai,
        addresses.stablecoins.crvUSD,
        addresses.stablecoins.zunUSD,

        addresses.stablecoins.usdt,
        addresses.stablecoins.dai,
        addresses.stablecoins.crvUSD,
        addresses.stablecoins.zunUSD,

        addresses.stablecoins.usdt,
        addresses.stablecoins.usdc,
        addresses.stablecoins.crvUSD,
        addresses.stablecoins.zunUSD,

        addresses.stablecoins.usdt,
        addresses.stablecoins.usdc,
        addresses.stablecoins.dai,
        addresses.stablecoins.zunUSD,
    ];
    const routes = [
        [
            addresses.stablecoins.usdt,
            '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
            addresses.stablecoins.usdc,
        ],
        [
            addresses.stablecoins.usdt,
            '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
            addresses.stablecoins.dai,
        ],
        [
            addresses.stablecoins.usdt,
            '0x390f3595bCa2Df7d23783dFd126427CCeb997BF4',
            addresses.stablecoins.crvUSD,
        ],
        [
            addresses.stablecoins.usdt,
            '0x390f3595bCa2Df7d23783dFd126427CCeb997BF4',
            addresses.stablecoins.crvUSD,
            '0x8c24b3213fd851db80245fccc42c40b94ac9a745',
            addresses.stablecoins.zunUSD,
        ],

        [
            addresses.stablecoins.usdc,
            '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
            addresses.stablecoins.usdt,
        ],
        [
            addresses.stablecoins.usdc,
            '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
            addresses.stablecoins.dai,
        ],
        [
            addresses.stablecoins.usdc,
            '0x4dece678ceceb27446b35c672dc7d61f30bad69e',
            addresses.stablecoins.crvUSD,
        ],
        [
            addresses.stablecoins.usdc,
            '0x4dece678ceceb27446b35c672dc7d61f30bad69e',
            addresses.stablecoins.crvUSD,
            '0x8c24b3213fd851db80245fccc42c40b94ac9a745',
            addresses.stablecoins.zunUSD,
        ],

        [
            addresses.stablecoins.dai,
            '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
            addresses.stablecoins.usdt,
        ],
        [
            addresses.stablecoins.dai,
            '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
            addresses.stablecoins.usdc,
        ],
        [
            addresses.stablecoins.dai,
            '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
            addresses.stablecoins.usdt,
            '0x390f3595bCa2Df7d23783dFd126427CCeb997BF4',
            addresses.stablecoins.crvUSD,
        ],
        [
            addresses.stablecoins.dai,
            '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
            addresses.stablecoins.usdt,
            '0x390f3595bCa2Df7d23783dFd126427CCeb997BF4',
            addresses.stablecoins.crvUSD,
            '0x8c24b3213fd851db80245fccc42c40b94ac9a745',
            addresses.stablecoins.zunUSD,
        ],

        [
            addresses.stablecoins.crvUSD,
            '0x390f3595bCa2Df7d23783dFd126427CCeb997BF4',
            addresses.stablecoins.usdt,
        ],
        [
            addresses.stablecoins.crvUSD,
            '0x4dece678ceceb27446b35c672dc7d61f30bad69e',
            addresses.stablecoins.usdc,
        ],
        [
            addresses.stablecoins.crvUSD,
            '0x4dece678ceceb27446b35c672dc7d61f30bad69e',
            addresses.stablecoins.usdc,
            '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
            addresses.stablecoins.dai,
        ],
        [
            addresses.stablecoins.crvUSD,
            '0x8c24b3213fd851db80245fccc42c40b94ac9a745',
            addresses.stablecoins.zunUSD,
        ],
    ];
    const swapParams = [
        [[2, 1, 1, 1, 3]],
        [[2, 0, 1, 1, 3]],
        [[0, 1, 1, 1, 2]],
        [
            [0, 1, 1, 1, 2],
            [0, 1, 1, 1, 2],
        ],

        [[1, 2, 1, 1, 3]],
        [[1, 0, 1, 1, 3]],
        [[0, 1, 1, 1, 2]],
        [
            [0, 1, 1, 1, 2],
            [0, 1, 1, 1, 2],
        ],

        [[0, 2, 1, 1, 3]],
        [[0, 1, 1, 1, 3]],
        [
            [0, 2, 1, 1, 3],
            [0, 1, 1, 1, 2],
        ],
        [
            [0, 2, 1, 1, 3],
            [0, 1, 1, 1, 2],
            [0, 1, 1, 1, 2],
        ],

        [[1, 0, 1, 1, 2]],

        [[1, 0, 1, 1, 2]],
        [
            [1, 0, 1, 1, 2],
            [1, 0, 1, 1, 3],
        ],
        [[0, 1, 1, 1, 2]],
    ];
    await tokenConverter.setRoutes(tokenIns, tokenOuts, routes, swapParams);
}

async function setupTokenConverterETHs(tokenConverter) {
    const tokenIns = [
        addresses.crypto.frxETH,
        addresses.crypto.wEth,
        addresses.crypto.frxETH,
        addresses.crypto.wEth,
        addresses.crypto.zunETH,
        addresses.crypto.zunETH,
    ];
    const tokenOuts = [
        addresses.crypto.wEth,
        addresses.crypto.frxETH,
        addresses.crypto.zunETH,
        addresses.crypto.zunETH,
        addresses.crypto.frxETH,
        addresses.crypto.wEth,
    ];
    const routes = [
        [
            '0x5e8422345238f34275888049021821e8e08caa1f',
            '0x9c3b46c0ceb5b9e304fcd6d88fc50f7dd24b31bc',
            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        ],
        [
            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            '0x9c3b46c0ceb5b9e304fcd6d88fc50f7dd24b31bc',
            '0x5e8422345238f34275888049021821e8e08caa1f',
        ],
        [
            '0x5e8422345238f34275888049021821e8e08caa1f',
            '0x3a65cbaebbfecbea5d0cb523ab56fdbda7ff9aaa',
            '0xc2e660c62f72c2ad35ace6db78a616215e2f2222',
        ],
        [
            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            '0x9c3b46c0ceb5b9e304fcd6d88fc50f7dd24b31bc',
            '0x5e8422345238f34275888049021821e8e08caa1f',
            '0x3a65cbaebbfecbea5d0cb523ab56fdbda7ff9aaa',
            '0xc2e660c62f72c2ad35ace6db78a616215e2f2222',
        ],
        [
            '0xc2e660c62f72c2ad35ace6db78a616215e2f2222',
            '0x3a65cbaebbfecbea5d0cb523ab56fdbda7ff9aaa',
            '0x5e8422345238f34275888049021821e8e08caa1f',
        ],
        [
            '0xc2e660c62f72c2ad35ace6db78a616215e2f2222',
            '0x3a65cbaebbfecbea5d0cb523ab56fdbda7ff9aaa',
            '0x5e8422345238f34275888049021821e8e08caa1f',
            '0x9c3b46c0ceb5b9e304fcd6d88fc50f7dd24b31bc',
            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        ],
    ];
    const swapParams = [
        [[1, 0, 1, 1, 2]],
        [[0, 1, 1, 1, 2]],
        [[1, 0, 1, 1, 2]],
        [
            [0, 1, 1, 1, 2],
            [1, 0, 1, 1, 2],
        ],
        [[0, 1, 1, 1, 2]],
        [
            [0, 1, 1, 1, 2],
            [1, 0, 1, 1, 2],
        ],
    ];

    await tokenConverter.setRoutes(tokenIns, tokenOuts, routes, swapParams);
}

async function setupTokenConverterRewards(tokenConverter) {
    const tokenIns = [
        addresses.crypto.crv,
        addresses.crypto.crv,
        addresses.crypto.cvx,
        addresses.crypto.cvx,
        addresses.crypto.sdt,
        addresses.crypto.sdt,
        addresses.crypto.fxs,
        addresses.crypto.fxs,
    ];
    const tokenOuts = [
        addresses.crypto.zunETH,
        addresses.stablecoins.zunUSD,
        addresses.crypto.zunETH,
        addresses.stablecoins.zunUSD,
        addresses.crypto.zunETH,
        addresses.stablecoins.zunUSD,
        addresses.crypto.zunETH,
        addresses.stablecoins.zunUSD,
    ];
    const routes = [
        [
            '0xd533a949740bb3306d119cc777fa900ba034cd52',
            '0x4ebdf703948ddcea3b11f675b4d1fba9d2414a14',
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            '0x9c3b46c0ceb5b9e304fcd6d88fc50f7dd24b31bc',
            '0x5e8422345238f34275888049021821e8e08caa1f',
            '0x3a65cbaebbfecbea5d0cb523ab56fdbda7ff9aaa',
            '0xc2e660c62f72c2ad35ace6db78a616215e2f2222',
        ],
        [
            '0xD533a949740bb3306d119CC777fa900bA034cd52',
            '0x4ebdf703948ddcea3b11f675b4d1fba9d2414a14',
            '0xf939e0a03fb07f59a73314e73794be0e57ac1b4e',
            '0x8c24b3213fd851db80245fccc42c40b94ac9a745',
            '0x8C0D76C9B18779665475F3E212D9Ca1Ed6A1A0e6',
        ],
        [
            '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b',
            '0x47d5e1679fe5f0d9f0a657c6715924e33ce05093',
            '0x5e8422345238f34275888049021821e8e08caa1f',
            '0x3a65cbaebbfecbea5d0cb523ab56fdbda7ff9aaa',
            '0xc2e660c62f72c2ad35ace6db78a616215e2f2222',
        ],
        [
            '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B',
            '0xb576491f1e6e5e62f1d8f26062ee822b40b0e0d4',
            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            '0x4ebdf703948ddcea3b11f675b4d1fba9d2414a14',
            '0xf939e0a03fb07f59a73314e73794be0e57ac1b4e',
            '0x8c24b3213fd851db80245fccc42c40b94ac9a745',
            '0x8C0D76C9B18779665475F3E212D9Ca1Ed6A1A0e6',
        ],
        [
            '0x73968b9a57c6e53d41345fd57a6e6ae27d6cdb2f',
            '0x954313005c56b555bdc41b84d6c63b69049d7847',
            '0x5e8422345238f34275888049021821e8e08caa1f',
            '0x3a65cbaebbfecbea5d0cb523ab56fdbda7ff9aaa',
            '0xc2e660c62f72c2ad35ace6db78a616215e2f2222',
        ],
        [
            '0x73968b9a57c6E53d41345FD57a6E6ae27d6CDB2F',
            '0x954313005c56b555bdc41b84d6c63b69049d7847',
            '0xf939e0a03fb07f59a73314e73794be0e57ac1b4e',
            '0x8c24b3213fd851db80245fccc42c40b94ac9a745',
            '0x8C0D76C9B18779665475F3E212D9Ca1Ed6A1A0e6',
        ],
        [
            '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0',
            '0x941eb6f616114e4ecaa85377945ea306002612fe',
            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            '0x9c3b46c0ceb5b9e304fcd6d88fc50f7dd24b31bc',
            '0x5e8422345238f34275888049021821e8e08caa1f',
            '0x3a65cbaebbfecbea5d0cb523ab56fdbda7ff9aaa',
            '0xc2e660c62f72c2ad35ace6db78a616215e2f2222',
        ],
        [
            '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0',
            '0x941eb6f616114e4ecaa85377945ea306002612fe',
            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            '0x4ebdf703948ddcea3b11f675b4d1fba9d2414a14',
            '0xf939e0a03fb07f59a73314e73794be0e57ac1b4e',
            '0x8c24b3213fd851db80245fccc42c40b94ac9a745',
            '0x8C0D76C9B18779665475F3E212D9Ca1Ed6A1A0e6',
        ],
    ];
    const swapParams = [
        [
            [2, 1, 1, 3, 3],
            [0, 1, 1, 1, 2],
            [1, 0, 1, 1, 2],
        ],
        [
            [2, 0, 1, 3, 3],
            [0, 1, 1, 1, 2],
        ],
        [
            [1, 0, 1, 2, 2],
            [1, 0, 1, 1, 2],
        ],
        [
            [1, 0, 1, 2, 2],
            [1, 0, 1, 3, 3],
            [0, 1, 1, 1, 2],
        ],
        [
            [2, 1, 1, 3, 3],
            [1, 0, 1, 1, 2],
        ],
        [
            [2, 0, 1, 3, 3],
            [0, 1, 1, 1, 2],
        ],
        [
            [1, 0, 1, 2, 2],
            [0, 1, 1, 1, 2],
            [1, 0, 1, 1, 2],
        ],
        [
            [1, 0, 1, 2, 2],
            [1, 0, 1, 3, 3],
            [0, 1, 1, 1, 2],
        ],
    ];
    await tokenConverter.setRoutes(tokenIns, tokenOuts, routes, swapParams);
}

async function setupTokenConverterCrvUsdToZunEth(tokenConverter) {
    const tokenInAddr = addresses.stablecoins.crvUSD;
    const tokenOutAddr = addresses.crypto.zunETH;

    await tokenConverter.setRoute(
        tokenInAddr,
        tokenOutAddr,
        [
            addresses.stablecoins.crvUSD,
            '0x954313005c56b555bdc41b84d6c63b69049d7847',
            addresses.crypto.frxETH,
            '0x3a65cbaebbfecbea5d0cb523ab56fdbda7ff9aaa',
            addresses.crypto.zunETH,
        ],
        [
            [0, 1, 1, 3, 3],
            [1, 0, 1, 1, 2],
        ]
    );
}

async function setupTokenConverterFxnToZunUsd(tokenConverter) {
    const tokenInAddr = addresses.crypto.fxn;
    const tokenOutAddr = addresses.stablecoins.zunUSD;

    await tokenConverter.setRoute(
        tokenInAddr,
        tokenOutAddr,
        [
            addresses.crypto.fxn,
            '0xc15f285679a1ef2d25f53d4cbd0265e1d02f2a92',
            '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            '0x4ebdf703948ddcea3b11f675b4d1fba9d2414a14',
            addresses.stablecoins.crvUSD,
            '0x8c24b3213fd851db80245fccc42c40b94ac9a745',
            addresses.stablecoins.zunUSD,
        ],
        [
            [1, 0, 1, 3, 2],
            [1, 0, 1, 3, 3],
            [0, 1, 1, 1, 2],
        ]
    );
}

async function setupTokenConverterWEthPxEthAndReverse(tokenConverter) {

    await tokenConverter.setRoutes(
        [addresses.crypto.wEth, addresses.crypto.pxETH],
        [addresses.crypto.pxETH, addresses.crypto.wEth],
        [
            [
                addresses.crypto.wEth,
                '0xC8Eb2Cf2f792F77AF0Cd9e203305a585E588179D',
                addresses.crypto.pxETH,
            ],
            [
                addresses.crypto.pxETH,
                '0xC8Eb2Cf2f792F77AF0Cd9e203305a585E588179D',
                addresses.crypto.wEth,
            ]
        ],[
            [
                [0, 1, 1, 1, 2]
            ],
            [
                [1, 0, 1, 1, 2]
            ]
        ]
    );
}

async function setupTokenConverterBTCs(tokenConverter) {
    await tokenConverter.setRoutes(
        [addresses.crypto.tBtc, addresses.crypto.wBtc],
        [addresses.crypto.wBtc, addresses.crypto.tBtc],
        [
            [
                addresses.crypto.tBtc,
                '0xB7ECB2AA52AA64a717180E030241bC75Cd946726',
                addresses.crypto.wBtc,
            ],
            [
                addresses.crypto.wBtc,
                '0xB7ECB2AA52AA64a717180E030241bC75Cd946726',
                addresses.crypto.tBtc,
            ]
        ],[
            [
                [1, 0, 1, 1, 2]
            ],
            [
                [0, 1, 1, 1, 2]
            ]
        ]
    );
}

async function setupTokenConverterStablesFrax(tokenConverter) {
    const tokenIns = [
        addresses.stablecoins.usdt,
        addresses.stablecoins.usdc,
        addresses.stablecoins.dai,
        addresses.stablecoins.frax,
        addresses.stablecoins.frax,
        addresses.stablecoins.frax
    ];
    const tokenOuts = [
        addresses.stablecoins.frax,
        addresses.stablecoins.frax,
        addresses.stablecoins.frax,
        addresses.stablecoins.usdt,
        addresses.stablecoins.usdc,
        addresses.stablecoins.dai
    ];
    const routes = [
        [
            addresses.stablecoins.usdt,
            '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
            addresses.stablecoins.usdc,
            '0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2',
            addresses.stablecoins.frax,
        ],
        [
            addresses.stablecoins.usdc,
            '0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2',
            addresses.stablecoins.frax,
        ],
        [
            addresses.stablecoins.dai,
            '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
            addresses.stablecoins.usdc,
            '0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2',
            addresses.stablecoins.frax,
        ],
        [
            addresses.stablecoins.frax,
            '0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2',
            addresses.stablecoins.usdc,
            '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
            addresses.stablecoins.usdt,
        ],
        [
            addresses.stablecoins.frax,
            '0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2',
            addresses.stablecoins.usdc,
        ],
        [
            addresses.stablecoins.frax,
            '0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2',
            addresses.stablecoins.usdc,
            '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
            addresses.stablecoins.dai,
        ],
    ];
    const swapParams = [
        [
            [2, 1, 1, 1, 3],
            [1, 0, 1, 1, 2],
        ],
        [[1, 0, 1, 1, 2]],
        [
            [0, 1, 1, 1, 3],
            [1, 0, 1, 1, 2],
        ],
        [
            [0, 1, 1, 1, 2],
            [1, 2, 1, 1, 3],
        ],
        [[0, 1, 1, 1, 2]],
        [
            [0, 1, 1, 1, 2],
            [1, 0, 1, 1, 3],
        ],
    ];
    await tokenConverter.setRoutes(tokenIns, tokenOuts, routes, swapParams);
}

module.exports = {
    setupTokenConverterETHs,
    setupTokenConverterStables,
    setupTokenConverterRewards,
    setupTokenConverterCrvUsdToZunEth,
    setupTokenConverterFxnToZunUsd,
    setupTokenConverterWEthPxEthAndReverse,
    setupTokenConverterBTCs,
    setupTokenConverterStablesFrax
};
