const perms = require('../util/perm');

const bitField = {
    help: 1 << 0,
    base: 1 << 1
};

module.exports = {
    help: 'Disconect the bot',
    func: async(client, msg, args, guildMember) => {
        try{await perms.check(guildMember, "log_out.base")}catch(e) {return msg.channel.send(e.message)}
        msg.reply(' has shut me down');
        client.destroy((err) => {console.log(err);});


    }
};
module.exports.bitField = bitField;