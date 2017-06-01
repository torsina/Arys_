const perms = require('../config/perm/perms');
const config = require('../config/config');
module.exports = {
    help: "\u00af\\_(\u30c4)_\/\u00af",
    func: (client, msg, args, role) => {
        if(config.env === "dev") return;
        if(perms.check("interaction.shrug.base", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `interaction.shrug.base`");
            return;
        }
        msg.delete();
        msg.channel.sendMessage("\u00af\\_(\u30c4)_\/\u00af");

    }
};