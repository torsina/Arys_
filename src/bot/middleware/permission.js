const BitField = require("../util/BitField");
const EmbedError = require("discord.js-wiggle/lib/EmbedError");
module.exports = async (message, next, wiggle) => {
    const { command } = message;
    if (!command) return next();
    const { owner } = wiggle.locals.options;
    // bypass for bot owner
    if (message.author.id === owner) return next();
    const categoryName = message.category;
    const commandName = message.command.name;
    const argName = (message.command.args && message.command.args[0] && !message.command.args[0].optional) ? message.command.args[0].name : "base";
    const permissionNodeString = [categoryName, commandName, argName].join(".");
    try {
        const result = BitField.check(permissionNodeString, message, message.guildSetting);
        if (!result) {
            const { embed } = new EmbedError(message, { error: "permission.denied", data: { node: permissionNodeString } });
            return message.channel.send(embed);
        }
    } catch ({ embed }) {
        return message.channel.send(embed);
    }
    message.permission = permissionNodeString;
    return next();
};