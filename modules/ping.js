const config = require('../config/config');
const perms = require('../config/perms');

module.exports = {
    help: 'Ping, Pong',
    func: (client, msg, args, role) => {
       //if(perms.check("purge.all", role) === true) {
           msg.channel.sendMessage(perms.check("", role));
       //}
    }
};
