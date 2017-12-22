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
        this._DBStreams = options.DBStreams;
        this.settingStream = this._DBStreams.settingStream;
        this.memberStream = this._DBStreams.memberStream;
        this.client.init = async () => {
            // get all of the GuildSetting objects needed for this shard
            this.settings = await db.getGuildSetting(this.client.discordClient.guilds.keys());
            // start setting stream to stay in sync
            this.settingStream.on("data", update => {
                // cache update snippet
                if (this.client.discordClient.guilds.get(update.new_val.guildID)) {
                    const updated = new GuildSetting(update.new_val);
                    this.settings.set(update.new_val.guildID, updated);
                }
            });
            // add every guild that would have join while the bot was offline
            await db.initGuildSetting(this.client, this.settings);
            this.memberStream.on("data", update => {
                const guild = this.client.discordClient.guilds.get(update.new_val.guildID);
                if (guild) {
                    // get GuildMember
                    const guildMember = new GuildMember(update.new_val, this.settings.get(update.new_val.guildID));
                    // get the guild's GuildMember map
                    let guildMap = guildsMap.get(update.new_val.guildID);
                    if (!guildMap) {
                        guildMap = new Map();
                        // register the guild map in the map of all the guild maps
                        guildsMap.set(guildMember.guildID, guildMap);
                    }
                    // save the GuildMember in the guild's GuildMember map
                    guildMap.set(guildMember.memberID, guildMember);
                    // cache limit system
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
                // check for non-guild channel
                if (message.guild) {
                    message.GuildSetting = this.settings.get(message.guild.id);
                }
                message.constants = constants;
                message.FriendlyError = FriendlyError;
                return next();
            })
            .use("message", async (message, next) => {
                // check for non-guild channel
                if (!message.guild) return next();
                // check if bot talked
                if (message.author.bot) return next();
                // get the map of the guild
                let guildMap = guildsMap.get(message.guild.id);
                // create guild map if not initialized yet
                if (!guildMap) {
                    guildMap = new Map();
                    guildsMap.set(message.guild.id, guildMap);
                }
                message.GuildMemberMap = guildMap;
                // get guild member, call it if not cached
                message.GuildMember = guildMap.get(message.author.id);
                if (!message.GuildMember) {
                    const guildMember = await db.getGuildMember(message.author.id, message.guild.id, message.GuildSetting);
                    guildMap.set(message.author.id, guildMember);
                    // cache limit system
                    if (guildMap.size > 30 + Math.floor(message.guild.memberCount * 0.06)) {
                        const mapFirstKey = guildMap.keys().next().value;
                        guildMap.delete(mapFirstKey);
                    }
                    message.GuildMember = guildMember;
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