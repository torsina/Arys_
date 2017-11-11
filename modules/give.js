const perms = require('../util/perm');
const config = require('../config/config');
const db = require('../util/rethinkdb');
const money = require('../util/money');
const Discord = require('discord.js');

const bitField = {
    help: 1 << 0,
    self: 1 << 1,
    other: 1 << 2
};

module.exports = {
    help: 'haxxed',
    func: async (client, msg, args, guildMember) => {
        let name = await money.getName(msg.guild.id);
        if(!msg.mentions.users.first()) {
            try{await perms.check(guildMember, msg.channel.id, "give.self")}catch(e) {return msg.channel.send(e.message)}
            msg.channel.send("You gave yourself " + args[0] + " " + name);
            let moneyName = await money.getName(msg.guild.id);
            let amount;
            try{
                amount = await money.amount(args[0]);
            } catch(e) {
                let embed = new Discord.RichEmbed()
                    .setColor("RED")
                    .setFooter('asked by ' + msg.author.tag)
                    .setTimestamp()
                    .addField("Error:", e.message);
                return msg.channel.send({embed});
            }
            let embed = new Discord.RichEmbed()
                .setColor("GREEN")
                .setFooter('asked by ' + msg.author.tag)
                .setTimestamp()
                .setDescription(`${msg.author.toString()},You gave yourself ${amount} ${moneyName}.`);
            msg.channel.send({embed});
            await db.changeMoney(msg.guild.id, msg.author.id, amount, {force: true}).catch(console.error);
        } else {
            try{await perms.check(guildMember, msg.channel.id, "give.other")}catch(e) {return msg.channel.send(e.message)}
            let moneyName = await money.getName(msg.guild.id);
            let amount;
            try{
                amount = await money.amount(args[1]);
            } catch(e) {
                let embed = new Discord.RichEmbed()
                    .setColor("RED")
                    .setFooter('asked by ' + msg.author.tag)
                    .setTimestamp()
                    .addField("Error:", e.message);
                return msg.channel.send({embed});
            }
            let embed = new Discord.RichEmbed()
                .setColor("GREEN")
                .setFooter('asked by ' + msg.author.tag)
                .setTimestamp()
                .setDescription(`${msg.author.toString()},You gave ${amount} ${moneyName} to ${msg.mentions.users.first().toString()}.`);
            msg.channel.send({embed});
            await db.changeMoney(msg.guild.id, msg.mentions.users.first().id, amount, {force: true}).catch(console.error);
        }
    }
};
module.exports.bitField = bitField;
