const privateConfig = require('./config_private');
const config = {
    db: {
        host: "192.168.1.30",
        port: "28015"
    },
    env: "",
    sentry: privateConfig.sentry
};
if (process.env.NODE_ENV === "dev" || config.env === "dev") privateConfig.token = privateConfig.token.dev;
else privateConfig.token = privateConfig.token.bot;
config.token = privateConfig.token;
module.exports = config;