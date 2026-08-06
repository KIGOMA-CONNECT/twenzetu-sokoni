require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'CommonJS' } });
module.exports = require('./jest.config.cts');
