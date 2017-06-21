const perms = require('../config/perm/perms');
module.exports = {
    help: 'Disconect the bot',
    func: (client, msg, args, role) => {
        if(perms.check("mod.logout.base", role, msg.author.id) !== true) {
            msg.channel.send("You don't have the permission `mod.logout.base`");
        }
        else {
            msg.reply(' has shut me down');
            client.destroy((err) => {console.log(err);});
        }
    }
};