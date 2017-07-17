const perms = require('../util/perm');
const db = require('../util/rethinkdb');
const money = require('../util/money');
const config = require('../config/config');

const bitField = {
    help: 1 << 0,
    base: 1 << 1
};

module.exports = {
    help: 'Get lucky, or not.',
    func: async(client, msg, args,  guildMember) => {
        //if(config.env === "dev") return;
        try{await perms.check(guildMember, "bet.base")}catch(e) {return msg.channel.send(e.message)}
        let random = Math.random();
        let choice = args[0];
        let setting = await db.getSetting(msg.guild.id);
        let multiplier;
        let name = await money.getName(msg.guild.id);
        if(setting.money && setting.money.bet)multiplier = setting.money.bet.multiplier;
        else multiplier = config.money.bet.multiplier;
        if(random < 0.5) { //head
            if(choice === "h") {
                msg.channel.send("You won " + Math.floor(parseInt(args[1]*multiplier)) + " " + name + "!");
                db.changeMoney(msg.guild.id, msg.author.id, Math.floor(parseInt(args[1]*1.98))).catch(e => {msg.channel.send(e.message)});
            } else {
                msg.channel.send("You loose " + args[1] + " " + name + ".");
                db.changeMoney(msg.guild.id, msg.author.id, -parseInt(args[1])).catch(e => {msg.channel.send(e.message)});
            }
        } else { //tails
            if(choice === "t") {
                msg.channel.send("You won " + Math.floor(parseInt(args[1]*multiplier)) + " " + name + "!");
                db.changeMoney(msg.guild.id, msg.author.id, Math.floor(parseInt(args[1]*1.98))).catch(e => {msg.channel.send(e.message)});
            } else {
                msg.channel.send("You loose " + args[1] + " " + name + ".");
                db.changeMoney(msg.guild.id, msg.author.id, -parseInt(args[1])).catch(e => {msg.channel.send(e.message)});
            }
        }
    }
};
module.exports.bitField = bitField;