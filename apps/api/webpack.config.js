/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-env node */
/* eslint-disable no-undef */
const { composePlugins, withNx } = require('@nx/webpack');

module.exports = composePlugins(withNx(), (config) => {
  return config;
});
