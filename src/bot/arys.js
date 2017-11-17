const wiggle = require("discord.js-wiggle");
const config = require("../../config");
const constants = require("../util/constants");
const db = require("./util/rethink");
const GuildSetting = require("./structures/GuildSetting");
const GuildMember = require("./structures/GuildMember");
const FriendlyError = require("./structures/FriendlyError");
const util = require("util");
const middlewares = require("./middleware/main");
const guildsMap = new Map();

class Arys {
    constructor(options) {
        this.settings = new Map;
        this.client = wiggle(options);
        this.client.init = async () => {
            await db.init(this.client);
            this.settings = await db.getGuildSetting(this.client.discordClient.guilds.keys());
            // start setting stream to stay in sync
            this.settingStream = await db.streamGuildSetting();
            this.settingStream.on("data", update => {
                if (this.client.discordClient.guilds.get(update.new_val.guildID)) {
                    const updated = new GuildSetting(update.new_val);
                    console.log(util.inspect(updated, false, null));
                    this.settings.set(update.new_val.guildID, updated);
                }
            });
            await db.initGuildSetting(this.client, this.settings);
            // start member stream to stay in sync
            this.memberStream = await db.streamGuildMember();
            this.memberStream.on("data", update => {
                const guild = this.client.discordClient.guilds.get(update.new_val.guildID);
                if (guild) {
                    const guildMember = new GuildMember(update.new_val, this.settings.get(update.new_val.guildID));
                    let guildMap = guildsMap.get(update.new_val.guildID);
                    if (!guildMap) {
                        guildMap = new Map();
                        guildsMap.set(guildMember.guildID, guildMap);
                    }
                    guildMap.set(guildMember.memberID, guildMember);
                    if (guildMap.size > 30 + Math.floor(guild.memberCount * 0.06)) {
                        const mapFirstKey = guildMap.keys().next().value;
                        guildMap.delete(mapFirstKey);
                    }
                }
            });
            console.log(util.inspect(this.settings, false, null));
        };
        this.client.set("owner", "306418399242747906")
            .set("prefixes", ["mention", `"`])
            .set("token", config.token)
            .set("commandOptions", { sendTyping: true, embedError: true })
            .use("ready", async (next) => {
                await this.client.init();
                next();
            })
            .use("message", wiggle.middleware.commandParser(), wiggle.middleware.argHandler)
            .use("message", async (message, next) => {
                // check for dm channel
                if (message.guild) {
                    message.GuildSetting = this.settings.get(message.guild.id);
                }
                message.constants = constants;
                message.FriendlyError = FriendlyError;
                return next();
            })
            .use("message", async (message, next) => {
                // check for dm channel
                if (!message.guild) return next();
                // get the map of the guild
                let guildMap = guildsMap.get(message.guild.id);
                // create if if not initialized yet
                if (!guildMap) {
                    guildMap = new Map();
                    guildsMap.set(message.guild.id, guildMap);
                }
                message.GuildMemberMap = guildMap;
                // get guild member, call it if not cached
                const guildMemberStored = guildMap.get(message.author.id);
                if (!guildMemberStored) {
                    const guildMember = await db.getGuildMember(message.author.id, message.guild.id, message.GuildSetting);
                    guildMap.set(message.author.id, guildMember);
                    message.GuildMember = guildMember;
                } else {
                    message.GuildMember = guildMemberStored;
                }
                return next();
            })
            .use("message", middlewares.activity, middlewares.permission)
            .set("commands", "./bot/commands")
            .set("locales", "./bot/locales")
            .set("listeners", "./bot/events");
        this.client.connect();
    }
}

module.exports = Arys;