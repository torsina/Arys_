const config = require('../config/config');
const perms = require('../config/perms');

module.exports = {
    help: 'Ping, Pong',
    func: (client, msg, args, role) => {
       if(perms.check("ping.base", role) === true) {
           msg.channel.sendMessage("THE PERM SYSTEM WORK BITCHES");
       }
    }
};
