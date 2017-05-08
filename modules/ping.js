const perms = require('../config/perm/perms');
module.exports = {
    help: 'Ping, Pong',
    func: (client, msg, args, role) => {
        if(perms.check("ping.base", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `ping.base`");
            return;
        }
        //let myRole = msg.guild.roles.find("name", "Dindu Nuffin");
        //console.log(myRole);
        msg.channel.sendMessage("pong");
    }
};
