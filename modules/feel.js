module.exports = {
    help: 'Ping, Pong',
    func: (client, msg, args) => {
        msg.channel.sendMessage('I can see their regrets everytime. The ones they had feelings for. But they all end up the same way, as red stains on my hands. Will you join them ?').setTimeout(function() {
            msg.delete();
        });

    }
};