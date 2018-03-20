const db = require("../util/rethink");
const EmbedError = require("discord.js-wiggle/lib/EmbedError");
module.exports = async (message, next) => {
    if (!message.author.bot) {
        const { min, max } = message.guildSetting.money.activity;
        // get guild member from cache, cache it if not in it
        const guildMember = message.GuildMember;
        const difference = Date.now() - guildMember.money.activity.lastGet;
        // if the cooldown is not over
        if (difference < message.guildSetting.money.activity.wait) return next();
        const value = Math.floor((Math.random() * (max - min)) + min);
        try {
            guildMember.money.editMoney(value);
            guildMember.money.setActivityCooldown();
            await db.editGuildMember(guildMember);
        } catch (err) {
            console.error(err);
            const error = {
                error: err.message,
                data: {
                    currency: message.guildSetting.money.name
                }
            };
            const { embed } = new EmbedError(message, error);
            return message.channel.send(embed);
        }
    }
    return next();
};