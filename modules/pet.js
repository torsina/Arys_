const perms = require('../config/perm/perms');
module.exports = {
    help: 'show me',
    func: (client, msg, args, role) => {
        if(perms.check("interaction.pet.base", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `interaction.pet.base`");
            return;
        }
        msg.delete();
        msg.channel.sendMessage("'It's okay lil buddy <@" + msg.author.id +">, you have nothing to fear now. Show me who did this to you, I'll make sure that they won't do this ever again.");

    }
};