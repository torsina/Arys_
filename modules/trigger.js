const perms = require('../config/perms');
module.exports = {
    help: 'You dont want to see this',
    func: (client, msg, args, role) => {

        if(perms.check("interaction.trigger.base", role) !== true) {
            msg.channel.sendMessage("You don't have the permission to do that");
            return;
        }
        msg.delete();
        msg.channel.sendMessage('I can see their regrets everytime. The ones they had feelings for. But they all end up the same way, as red stains on my hands. Will you join them ?');

    }
};