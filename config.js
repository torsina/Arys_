const privateConfig = require("./config_private");
const config = {
    env: "dev",
    oauthScopes: ["identify", "guilds"],
    token: privateConfig.token.dev,
    sentry: privateConfig.sentry,
    webSocket: {
        host: "127.0.0.1",
        port: 15000
    }
};
config.db = privateConfig.db;
module.exports = config;