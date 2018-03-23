const privateConfig = require('./config_private');
const config = {
    db: {
        host: "127.0.0.1",
        port: "28015",
        name: "Arys_rewrite"
    },
    env: "dev"
};
if (process.env.NODE_ENV === "dev" || config.env === "dev") privateConfig.token = privateConfig.token.dev;
else {
    privateConfig.token = privateConfig.token.bot;
    config.sentry = privateConfig.sentry;
}
config.token = privateConfig.token;
module.exports = config;