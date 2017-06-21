const perms = require('../config/perm/perms');
const config = require('../config/config');
module.exports = {
    help: 'You dont want to see this',
    func: (client, msg, args, role) => {
        if(config.env === "dev") return;
        if(perms.check("interaction.trigger.base", role, msg.author.id) !== true) {
            msg.channel.send("You don't have the permission `interaction.trigger.base`");
            return;
        }
        msg.delete();
        msg.channel.send('I can see their regrets everytime. The ones they had feelings for. But they all end up the same way, as red stains on my hands. Will you join them ?');

    }
};