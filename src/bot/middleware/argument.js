const db = require("../util/rethink");
const EmbedError = require("discord.js-wiggle/lib/EmbedError");
module.exports = async (message, next) => {
    const { command } = message;
    if (!command) return next();
    try {
        message.args = await command.argParser(message, message.args);
    } catch (err) {
        const error = {
            error: err.message,
            data: err.data
        };
        if (!error.error) {
            error.error = "wiggle.missingArgs";
            error.data = { command: message.command.name, usage: "" };
        }
        const { embed } = new message.command.EmbedError(message, error);
        message.channel.send(embed);
        return;
    }
    return next();
};