const BitField = require("../util/BitField");
const constants = require("../../util/constants");
module.exports = async (context, next, wiggle) => {
    const { command } = context;
    const { isOwner } = context.message;
    if (!command) return next();
    // bypass for bot owner
    if (isOwner) return next();
    const categoryName = context.command.category;
    const commandName = context.command.name;
    const argumentName = (typeof context.args[0] === "string") ? context.args[0] : "base";
    const permissionNodeString = constants.PERMISSION_NODE[categoryName][commandName][argumentName];
    try {
        const evaluated = await BitField.check(permissionNodeString, context, context.guildSetting);
        if (!evaluated.result) {
            const { embed } = new context.command.EmbedError(context, { error: "permission.denied", data: { node: permissionNodeString } });
            return context.channel.send(embed);
        }
        context.permissionFields = evaluated.fields;
    } catch (err) {
        return console.error(err);
    }
    context.permission = permissionNodeString;
    return next();
};