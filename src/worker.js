const config = require("../config");
const moment = require("moment");
const db = require("./bot/util/rethink");
let Raven;

if (config.sentry) {
    Raven = require("raven");
    Raven.config(config.sentry).install();
}

const workerConfig = JSON.parse(process.env.config);
switch (workerConfig.type) {
    case "bot": {
        (async function () { // eslint-disable-line
            const Arys = require("./bot/arys");
            const streams = await db.init();
            console.log(`worker ${process.pid} started, hosting shards ${workerConfig.shardStart} to ${workerConfig.shardEnd},` +
                ` with a total of ${workerConfig.shardRange} out of ${workerConfig.totalShards}`);
            const shards = [];
            for (let i = 0; i < workerConfig.shardRange; i++) {
                try {
                    const shardOptions = {
                        shardId: workerConfig.shardStart + i,
                        shardCount: workerConfig.totalShards,
                        DBStreams: streams
                    };
                    shards[i] = new Arys(shardOptions);
                } catch (err) {
                    console.error(err);
                }
            }
        })();
        break;
    }
    case "web": {
        const WebConstructor = require("./web/app");
        const web = new WebConstructor();
        console.log(`worker ${process.pid} started, handling the web server and the API`);
        break;
    }
}

process.on("unhandledRejection", err => {
    if (config.sentry) Raven.captureException(err);
    else console.error(`${moment().format("Y-M-D H:m:s Z")} Uncaught Promise Error: \n ${err.stack}`);
});

process.on("uncaughtException", err => {
    if (!config.sentry) console.error(`${moment().format("Y-M-D H:m:s Z")} Uncaught Exception Error: \n ${err.stack}`);
});