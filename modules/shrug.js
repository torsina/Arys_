const perms = require('../util/perm');
const config = require('../config/config');

const bitField = {
    help: 1 << 0,
    base: 1 << 1
};

module.exports = {
    help: "\u00af\\_(\u30c4)_\/\u00af",
    func: async(client, msg, args, guildMember) => {
        if(config.env === "dev") return;
        try{await perms.check(guildMember, msg.channel.id, "shrug.base")}catch(e) {return msg.channel.send(e.message)}
        msg.delete();
        msg.channel.send("\u00af\\_(\u30c4)_\/\u00af");
    }
};
module.exports.bitField = bitField;