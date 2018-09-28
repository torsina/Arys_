const db = require("../util/rethink");
const EmbedError = require("discord.js-wiggle/lib/EmbedError");
module.exports = async (message, next) => {
    const { command, FriendlyError } = message;
    if (!command) return next();
    try {
        message.args = await command.argParser(message, message.args);
    } catch (err) {
        if (err instanceof FriendlyError) {
            const error = {
                error: err.message
            };
            Object.assign(error.data = {}, err.data, { prefix: message.prefixes[0]});
            console.log(error);
            const { embed } = new message.command.EmbedError(message, error);
            message.channel.send(embed);
            return;
        } else throw err;
    }
    return next();
};
