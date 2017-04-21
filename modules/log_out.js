const perms = require('../config/perms');
module.exports = {
    help: 'Disconect the bot',
    func: (client, msg, args, role) => {
        if(perms.check("mod.logout.base", role) !== true) {
            msg.channel.sendMessage("You don't have the permission `mod.logout.base`");
        }
        else {
            msg.reply(' has shut me down');
            client.destroy((err) => {console.log(err);});
        }
    }
};