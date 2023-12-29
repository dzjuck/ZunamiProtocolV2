module.exports = {
    skipFiles: ['interfaces/', 'test/', 'dao/', 'configs/', 'view/', 'lib/ConicOracle/interfaces/'],
    mocha: {
        grep: '@skip-on-coverage',
        invert: true,
    },
};
