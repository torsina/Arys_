const BitField = require("../util/BitField");
const constants = require("../../util/constants");
module.exports = async (context, next, wiggle) => {
    const { command } = context;
    if (!command) return next();
    const { owner } = wiggle.locals.options;
    // bypass for bot owner
    if (context.author.id === owner) return next();
    const categoryName = context.command.category;
    const commandName = context.command.name;
    const permissionNodeString = constants.PERMISSION_NODE[categoryName][commandName][context.args[0]];
    //console.log(categoryName, commandName, argName, permissionNodeString);
    try {
        const result = await BitField.check(permissionNodeString, context, context.guildSetting);
        if (!result) {
            const { embed } = new context.command.EmbedError(context, { error: "permission.denied", data: { node: permissionNodeString } });
            return context.channel.send(embed);
        }
    } catch (err) {
        return console.error(err);
    }
    context.permission = permissionNodeString;
    return next();
};