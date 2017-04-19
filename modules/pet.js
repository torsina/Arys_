module.exports = {
    help: 'show me',
    func: (client, msg, args) => {
        msg.delete();
        msg.channel.sendMessage("'It's okay lil buddy <@" + msg.author.id +">, you have nothing to fear now. Show me who did this to you, I'll make sure that they won't do this ever again.");

    }
};