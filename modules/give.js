const perms = require('../util/perm');
const config = require('../config/config');
const db = require('../util/rethinkdb');
const money = require('../util/money');

const bitField = {
    help: 1 << 0,
    self: 1 << 1,
    other: 1 << 2
};

module.exports = {
    help: 'haxxed',
    func: async (client, msg, args, guildMember) => {
        if(!msg.mentions.users) {
            try{await perms.check(guildMember, "give.self")}catch(e) {return msg.channel.send(e.message)}
            db.changeMoney(msg.guild.id, msg.author.id, args[0]).catch(console.error);
        } else {
            try{await perms.check(guildMember, "give.other")}catch(e) {return msg.channel.send(e.message)}
            db.changeMoney(msg.guild.id, msg.mentions.users.first().id, args[args.length-1]).catch(console.error);
        }
    }
};
module.exports.bitField = bitField;
