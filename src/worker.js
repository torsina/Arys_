const config = require("../config");
const moment = require("moment");
let Raven;

/**
 * if (config.sentry) {
    Raven = require("raven");
    Raven.config(config.sentry).install();
}
 */

const workerConfig = JSON.parse(process.env.config);
switch (workerConfig.type) {
    case "bot": {
        const Arys = require("./bot/arys");
        console.log(`worker ${process.pid} started, hosting shards ${workerConfig.shardStart} to ${workerConfig.shardEnd},` +
            ` with a total of ${workerConfig.shardRange} out of ${workerConfig.totalShards}`);
        const shards = [];
        console.log(workerConfig.shardRange, typeof workerConfig.shardRange);
        for (let i = 0; i < workerConfig.shardRange; i++) {
            try {
                shards[i] = new Arys({ shardId: workerConfig.shardStart + i, shardCount: workerConfig.totalShards });
            } catch (err) {
                console.error(err);
            }
        }
        break;
    }
    case "image": {
        console.log(`worker ${process.pid} started, handling image processing`);
        break;
    }
    case "web": {
        console.log(`worker ${process.pid} started, handling the web server`);
        break;
    }
}

process.on("unhandledRejection", err => {
    if (config.sentry)Raven.captureException(err);
    else console.error(`${moment().format("Y-M-D H:m:s Z")} Uncaught Promise Error: \n ${err.stack}`);
});

process.on("uncaughtException", err => {
    if (!config.sentry)console.error(`${moment().format("Y-M-D H:m:s Z")} Uncaught Exception Error: \n ${err.stack}`);
});