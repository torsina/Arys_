const wiggle = require("discord.js-wiggle");
const config = require("../../config");
const constants = require("../util/constants");
const db = require("./util/rethink");
const GuildSetting = require("./structures/GuildSetting");
const util = require("util");
const middlewares = require("./middleware/main");

class Arys {
    constructor(options) {
        this.settings = new Map;
        this.client = wiggle(options);
        this.client.init = async () => {
            // starting sentry before everything else to log every error
            await db.init(this.client);
            this.settings = await db.getGuildSetting(this.client.discordClient.guilds.keys());
            this.settingStream = await db.streamGuildSetting();
            this.settingStream.on("data", update => {
                if (this.client.discordClient.guilds.get(update.new_val.guildID)) {
                    const updated = new GuildSetting(update.new_val);
                    console.log(util.inspect(updated, false, null));
                    this.settings.set(update.new_val.guildID, updated);
                }
            });
            await db.initGuildSetting(this.client, this.settings);
            console.log(util.inspect(this.settings, false, null));
        };
        this.client.set("owner", "306418399242747906")
            .set("prefixes", ["mention", `"`])
            .set("token", config.token)
            .set("commandOptions", { sendTyping: true, replyResult: true, embedError: true })
            .use("ready", async (next) => {
                await this.client.init();
                next();
            })
            .use("message", wiggle.middleware.commandParser(), wiggle.middleware.argHandler)
            .use("message", (message, next) => {
                // check for dm channel
                if (!message.guild) return next();
                message.GuildSetting = this.settings.get(message.guild.id);
                message.constants = constants;
                next();
            })
            .use("message", middlewares.permission)
            .set("commands", "./bot/commands")
            .set("locales", "./bot/locales")
            .set("listeners", "./bot/events");
        this.client.connect();
    }
}

module.exports = Arys;