const perms = require('../config/perm/perms');
const objectPath = require('object-path');
const roles = require('../config/perm/roles').JSON;
module.exports = {
    help: 'Ping, Pong',
    func: (client, msg, args, role) => {
       if(perms.check("ping.base", role) === true) {
           msg.channel.sendMessage(perms.check("", args[0]));
       }
       else{
           msg.channel.sendMessage("false");
       }
    }
};
