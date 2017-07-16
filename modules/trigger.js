const perms = require('../util/perm');
const config = require('../config/config');

const bitField = {
    help: 1 << 0,
    base: 1 << 1
};

module.exports = {
    help: 'You dont want to see this',
    func: async (client, msg, args, guildMember) => {
        if(config.env === "dev") return;
        try{await perms.check(guildMember, "trigger.base")}catch(e) {return msg.channel.send(e.message)}
        msg.delete();
        msg.channel.send('I can see their regrets everytime. The ones they had feelings for. But they all end up the same way, as red stains on my hands. Will you join them ?');
    }
};
module.exports.bitField = bitField;