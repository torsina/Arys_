const Discord = require("discord.js");
const { token } = require("../config");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const webWorkersCount = 0;
const botCPUs = numCPUs - webWorkersCount;

console.log(`Master ${process.pid} is running`);
init();

async function init() {
    const workers = new Map;
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
        const worker = cluster.fork({ config: JSON.stringify(env) });
        const workerList = workers.get(env.type);
        if (!workerList) workers.set(env.type, [{ env, worker }]);
        else workerList.push({ env, worker });
    }
    for (let i = 0; i < webWorkersCount; i++) {
        const env = {
            type: "web"
        };
        const worker = cluster.fork({ config: JSON.stringify(env) });
        const workerList = workers.get(env.type);
        if (!workerList) workers.set(env.type, [{ env, worker }]);
        else workerList.push({ env, worker });
    }
    cluster.on("exit", (crashedWorker, code, signal) => {
        const env = JSON.parse(crashedWorker.env.config);
        const workerList = workers.get(env.type);
        const workerIndex = workerList.findIndex(worker => worker.worker === crashedWorker);
        if (workerIndex !== -1) workerList.splice(workerIndex, 1);
        if (signal) {
            console.log(`worker was killed by signal: ${signal}`);
        } else if (code !== 0) {
            console.log(`worker exited with error code: ${code}`);
        } else {
            console.log("worker success!");
        }
        console.log(`respawning worker ${process.env.pid}`);
        const newWorker = cluster.fork(crashedWorker.env);
        workerList.push = { env: crashedWorker.env, worker: newWorker };
    });
}