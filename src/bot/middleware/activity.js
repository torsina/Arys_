const db = require("../util/rethink");
module.exports = async (message, next) => {
    const { min, max } = message.GuildSetting.money.activity;
    // get guild member from cache, cache it if not in it
    const guildMember = message.GuildMember;
    const difference = Date.now() - guildMember.money.activity.lastGet;
    // if the cooldown is not over
    if (difference < message.GuildSetting.money.activity.wait) return next();
    const value = Math.floor((Math.random() * (max - min)) + min);
    guildMember.money.editMoney(value);
    guildMember.money.setActivityCooldown();
    await db.editGuildMember(guildMember);
    return next();
};