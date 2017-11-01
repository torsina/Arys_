const BitField = require("../util/BitField");
const constants = require("../../util/constants");
module.exports = async (message, next, wiggle) => {
    const { command } = message;
    if (!command) return next();
    const { owner } = wiggle.locals.options;
    // bypass for bot owner
    if (message.author.id === owner) return next();
    const categoryName = message.command.category;
    const commandName = message.command.name;
    const argName = (command.args && command.args[0] && !command.args[0].optional) ? message.args[0] : "base";
    const permissionNodeString = constants.PERMISSION_NODE.commands[categoryName][commandName][argName];
    try {
        const result = await BitField.check(permissionNodeString, message, message.GuildSetting);
        if (!result) {
            const { embed } = new message.command.EmbedError(message, { error: "permission.denied", data: { node: permissionNodeString } });
            return message.channel.send(embed);
        }
    } catch (err) {
        return console.error(err);
    }
    message.permission = permissionNodeString;
    return next();
};