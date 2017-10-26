const Discord = require("discord.js");
const { token } = require("../config");
const imageWorkers = 1;
const webWorkers = 0;
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const botCPUs = numCPUs - imageWorkers - webWorkers;

console.log(`Master ${process.pid} is running`);
init();

async function init() {
    const totalShards = await Discord.util.fetchRecommendedShards(token);
    let shardsPerWorker;
    if (botCPUs >= totalShards) shardsPerWorker = 1;
    else shardsPerWorker = Math.ceil(totalShards / botCPUs);
    const botWorkerCount = Math.ceil(totalShards / shardsPerWorker);
    for (let i = 0; i < botWorkerCount; i++) {
        const shardStart = i * shardsPerWorker;
        let shardEnd = ((i + 1) * shardsPerWorker) - 1;
        if (shardEnd > totalShards - 1) shardEnd = totalShards - 1;
        // since the first shardID is 0
        const shardRange = shardEnd - shardStart + 1;
        const env = {
            type: "bot",
            shardStart,
            shardEnd,
            shardRange,
            totalShards
        };
        cluster.fork({ config: JSON.stringify(env) });
    }
    for (let i = 0; i < imageWorkers; i++) {
        cluster.fork({ config: JSON.stringify({ type: "image" }) });
    }
    for (let i = 0; i < webWorkers; i++) {
        cluster.fork({ config: JSON.stringify({ type: "web" }) });
    }
}