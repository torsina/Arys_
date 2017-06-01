const perms = require('../config/perm/perms');
const config = require('../config/config');
module.exports = {
    help: 'Ping, Pong',
    func: (client, msg, args, role) => {
        if(config.env === "dev") return;
        if(perms.check("ping.base", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `ping.base`");
            return;
        }
        msg.channel.sendMessage("pong");
    }
};
