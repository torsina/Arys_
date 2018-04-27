const BitField = require("../util/BitField");
const constants = require("../../util/constants");
module.exports = async (message, next, wiggle) => {
    const { command, isOwner } = message;
    if (!command) return next();
    // bypass for bot owner
    if (isOwner) return next();
    const categoryName = message.command.category;
    const commandName = message.command.name;
    const argumentName = (typeof message.args[0] === "string") ? message.args[0] : "base";
    const permissionNodeString = constants.PERMISSION_NODE[categoryName][commandName][argumentName];
    try {
        const evaluated = await BitField.check(permissionNodeString, message, message.guildSetting);
        if (!evaluated.result) {
            const { embed } = new message.command.EmbedError(message, { error: "permission.denied", data: { node: permissionNodeString } });
            return message.channel.send(embed);
        }
        message.permissionFields = evaluated.fields;
    } catch (err) {
        return console.error(err);
    }
    message.permission = permissionNodeString;
    return next();
};