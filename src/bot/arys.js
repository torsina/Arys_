require("eris-additions")(require("eris"));
const wiggle = require("eris-wiggle");
const moment = require('moment');
const client = wiggle();
const config = require('../../config');
const db = require('./util/rethink');
const middlewares = require('./middleware/main');
let Raven, settings = new Map;
client.init = async () => {
    // starting sentry before everything else to log every error
    if (config.sentry) {
        Raven = require('raven');
        Raven.config(config.sentry).install();
    }
    await db.init(client);
    settings = await db.getGuildSetting();
    const settingStream = await db.streamGuildSetting();
    settingStream.on('data', update => {
        settings.set(update.new_val.guild, update.new_val);
    });
    await db.initGuildSetting(client, settings);
    console.log(settings);
};

client.set("owner", "306418399242747906")
    .set("prefixes", ["mention", "%"])
    .set("token", config.token)
    .set("commandOptions", { sendTyping: true, replyResult: true })
    .use("ready", async (next) => {
        await client.init();
        next();
    })
    .use("message", wiggle.middleware.commandParser(), wiggle.middleware.argHandler())
    .use("message", (message, next) => {
        message.guild.setting = settings.get(message.guild.id);
        next();
    })
    .use("message", middlewares.permission)
    .set("commands", "commands")
    .set("locales", "locales")
    .set("listeners", "events");
client.connect();

process.on("unhandledRejection", err => {
    if (config.sentry)Raven.captureException(err);
    else console.error(`${moment().format("Y-M-D H:m:s Z")} Uncaught Promise Error: \n ${err.stack}`);
});

process.on("uncaughtException", err => {
    if (!config.sentry)console.error(`${moment().format("Y-M-D H:m:s Z")} Uncaught Exception Error: \n ${err.stack}`);
});