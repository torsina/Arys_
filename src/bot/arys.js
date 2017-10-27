const wiggle = require("discord.js-wiggle");
const config = require("../../config");
const constants = require("../util/constants");
const db = require("./util/rethink");
const middlewares = require("./middleware/main");

class Arys {
    constructor(options) {
        process.send({ to: "image", type: "shopList", data: { list: [{ name: "test", hexColor: "#ff00", price: 500 }, { name: "test", hexColor: "#ff00", price: 500 }, { name: "test", hexColor: "#ff00", price: 500 }, { name: "test", hexColor: "#ff00", price: 500 }, { name: "test", hexColor: "#ff00", price: 500 }, { name: "test", hexColor: "#ff00", price: 500 }] } });
        this.settings = new Map;
        this.client = wiggle(options);
        this.client.init = async () => {
            // starting sentry before everything else to log every error
            await db.init(this.client);
            this.settings = await db.getGuildSetting(this.client.discordClient.guilds.keys());
            this.settingStream = await db.streamGuildSetting();
            this.settingStream.on("data", update => {
                if (this.client.discordClient.guilds.get(update.new_val.guildID)) {
                    this.settings.set(update.new_val.guildID, update.new_val);
                }
            });
            await db.initGuildSetting(this.client, this.settings);
            console.log(this.settings);
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