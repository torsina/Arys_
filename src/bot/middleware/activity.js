const db = require("../util/rethink");
const EmbedError = require("discord.js-wiggle/lib/EmbedError");
module.exports = async (message, next) => {
    const { min, max } = message.GuildSetting.money.activity;
    // get guild member from cache, cache it if not in it
    const guildMember = message.GuildMember;
    const difference = Date.now() - guildMember.money.activity.lastGet;
    // if the cooldown is not over
    if (difference < message.GuildSetting.money.activity.wait) return next();
    const value = Math.floor((Math.random() * (max - min)) + min);
    try {
        guildMember.money.editMoney(value);
    } catch (err) {
        console.error("trigger");
        const error = {
            error: err.message,
            data: {
                currency: message.GuildSetting.money.name
            }
        };
        const { embed } = new EmbedError(message, error);
        return message.channel.send(embed);
    }
    guildMember.money.setActivityCooldown();
    await db.editGuildMember(guildMember);
    return next();
};