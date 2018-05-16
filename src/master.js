const Discord = require("discord.js");
const ws = require("ws");
const { token, webSocket } = require("../config");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const webWorkersCount = 1;
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
        worker.env = env;
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
    // worker crash handling
    cluster.on("exit", (crashedWorker, code, signal) => {
        const { env } = crashedWorker;
        console.log(crashedWorker);
        const workerList = workers.get(env.type);
        const workerIndex = workerList.findIndex(worker => worker.worker === crashedWorker);
        if (workerIndex !== -1) workerList.splice(workerIndex, 1);
        if (signal) {
            console.log(`worker ${crashedWorker.process.pid} was killed by signal: ${signal}`);
        } else if (code !== 0) {
            console.log(`worker ${crashedWorker.process.pid} exited with error code: ${code}`);
        } else {
            console.log("worker success!");
        }
        console.log(`respawning worker ${crashedWorker.process.pid}`);
        const newWorker = cluster.fork({ config: JSON.stringify(env) });
        newWorker.env = env;
        workerList.push = { env: crashedWorker.env, worker: newWorker };
    });
    const webSocketConfig = { verifyClient: (socket) => {
        // only allow connections from localHost
            console.log("REMOTE IP : " + socket.req.connection.remoteAddress);
            //return socket.req.connection.remoteAddress === webSocket.host;
            return true;
        }};
    Object.assign(webSocketConfig, webSocket);

    const webSocketServer = new ws.Server(webSocketConfig);
    const webSocketClient = new ws(`ws://${webSocket.host}:${webSocket.port}`); // eslint-disable-line new-cap
    webSocketClient.on("message", (data) => {
        console.log(data);
    });
}