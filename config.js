const privateConfig = require('./config_private');
const config = {
    env: "dev"
};
if (process.env.NODE_ENV === "dev" || config.env === "dev") privateConfig.token = privateConfig.token.dev;
else {
    privateConfig.token = privateConfig.token.bot;
    config.sentry = privateConfig.sentry;
}
config.db = privateConfig.db;
config.token = privateConfig.token;
module.exports = config;