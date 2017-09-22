const perms = require('../util/perm');
const config = require('../config/config');

const bitField = {
    help: 1 << 0,
    base: 1 << 1
};

module.exports = {
    help: 'Ping, Pong',
    func: async(client, msg, args,  guildMember) => {
        //if(config.env === "dev") return;
        try{await perms.check(guildMember, msg.channel.id, "ping.base")}catch(e) {return msg.channel.send(e.message)}
        msg.channel.send("pong " + config.env);
    }
};
module.exports.bitField = bitField;