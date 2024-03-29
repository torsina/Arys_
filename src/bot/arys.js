// libs
const wiggle = require("discord.js-wiggle");
const { ResolverError } = require("discord.js-wiggle/lib/resolver");
const util = require("util");
const WebSocket = require("ws");
// utils
const config = require("../../config");
const constants = require("../util/constants");
const db = require("./util/rethink");
const BitField = require("./util/BitField");
const middlewares = require("./middleware/main");
// structures
const GuildSetting = require("./structures/GuildSetting");
const GuildMember = require("./structures/GuildMember");
const FriendlyError = require("./structures/FriendlyError");
const BetCount = require("./structures/BetCount");
const guildsMap = new Map();

class Arys {
    constructor(options) {
        this.settings = new Map;
        this.client = wiggle(options);
        this._DBStreams = options.DBStreams;
        this.settingStream = this._DBStreams.settingStream;
        this.memberStream = this._DBStreams.memberStream;
        this.client.init = async () => {
            const { guilds } = this.client.discordClient;
            // get all of the guildSetting objects needed for this shard
            this.settings = await db.getGuildSetting(guilds.keys());
            // start setting stream to stay in sync
            this.settingStream.on("data", update => {
                const { guildID } = update.new_val;
                // cache update snippet
                if (this.client.discordClient.guilds.has(guildID)) {
                    const updated = new GuildSetting(update.new_val);
                    this.settings.set(guildID, updated);
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
            // betCount cache gestion
            this.betCounts = new Map;
            const betCounts = await db.getBetCount(guilds.keys());
            betCounts.forEach(doc => {
                this.betCounts.set(doc.guildID, new BetCount(doc, this, true));
            });
            // ws client
            const { webSocket } = config;
            this.ws = new WebSocket(`ws://${webSocket.host}:${webSocket.port}`);
            this.ws.on("message", async (message) => {
                message = JSON.parse(message);
                switch (message.request) {
                    case "context": {
                        const { guildID, memberID } = message;
                        if (this.client.discordClient.guilds.has(guildID)) {
                            const guild = this.client.discordClient.guilds.get(guildID);
                            const guildSetting = this.settings.get(guildID);
                            if (guild.members.has(memberID)) {
                                const member = guild.members.get(memberID);
                                const context = { guild, member };
                                const permissionFields = await BitField.buildContext(context, guildSetting);
                                const response = {
                                    UUID: message.UUID,
                                    isOwner: guild.owner.id === memberID,
                                    permissionFields
                                };
                                this.ws.send(JSON.stringify(response));
                            }
                        }
                    }
                }
            })
        };
        this.client.set("owner", "306418399242747906")
            .set("prefixes", [`"`])
            .set("token", config.token)
            .set("commandOptions", { sendTyping: true, embedError: true })
            .set("getPrefixes", (message) => {
                // function that will return the prefix of the guild based on the message object
                const guildPrefix = message.guildSetting.prefixes;
                const botPrefix = this.client.get("prefixes");
                message.prefixes = guildPrefix.slice(0).concat(botPrefix);
                return message.prefixes;
            })
            .use("ready", async (next) => {
                await this.client.init();
                next();
            })
            .use("message", (message, next) => {
                if (message.guild) message.guildSetting = this.settings.get(message.guild.id);
                return next();
            })
            .use("message", wiggle.middleware.commandParser(), wiggle.middleware.argHandler)
            .use("message", async (message, next) => {
                // check for non-guild channel
                if (message.guild) {
                    const guildID = message.guild.id;
                    if (message.command) {
                        // additional data command-specific
                        switch (message.command.name) {
                            case "bet": {
                                let _BetCount = this.betCounts.get(guildID);
                                if (!_BetCount) {
                                    let doc = await db.createBetCount(message.guild.id);
                                    doc = doc.changes[0].new_val;
                                    _BetCount = new BetCount(doc);
                                    this.betCounts.set(guildID, _BetCount);
                                }
                                message.betCount = _BetCount;
                            }
                        }
                    }
                }
                message.constants = constants;
                message.FriendlyError = FriendlyError;
                message.ResolverError = ResolverError;
                message.BitField = BitField;
                message.isOwner = (this.client.locals.options.owner === message.author.id);
                return next();
            })
            // guildMember & guildMemberMap injection
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
                message.guildMemberMap = guildMap;
                // get guild member, call it if not cached
                message.guildMember = guildMap.get(message.author.id);
                if (!message.guildMember) {
                    const guildMember = await db.getGuildMember(message.author.id, message.guild.id, message.guildSetting);
                    guildMap.set(message.author.id, guildMember);
                    // cache limit system
                    if (guildMap.size > 30 + Math.floor(message.guild.memberCount * 0.06)) {
                        const mapFirstKey = guildMap.keys().next().value;
                        guildMap.delete(mapFirstKey);
                    }
                    message.guildMember = guildMember;
                }
                return next();
            })
            .use("message", async (message, next) => { await middlewares.argParser(message, next); }, middlewares.activity, middlewares.permission)
            .set("commands", "./bot/commands")
            .set("locales", "./bot/locales")
            .set("listeners", "./bot/events");
        this.client.connect();
    }
}

module.exports = Arys;
