const perms = require('../config/perm/perms');
module.exports = {
    help: "¯\_(ツ)_/¯",
    func: (client, msg, args, role) => {
        if(perms.check("interaction.shrug.base", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `interaction.shrug.base`");
            return;
        }
        msg.delete();
        msg.channel.sendMessage("\u00af\\_(\u30c4)_\/\u00af");

    }
};