module.exports = {
    help: "you don't want to see this",
    func: (client, msg, args) => {
        msg.channel.sendMessage('pong ' + args[0]);

    }
}