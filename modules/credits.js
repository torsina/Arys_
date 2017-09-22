const perms = require('../util/perm');
const config = require('../config/config');
const money = require('../util/money');
const db = require('../util/rethinkdb');
const Discord = require('discord.js');

const bitField = {
    help: 1 << 0,
    self: 1 << 1,
    other: 1 << 2
};

module.exports = {
    help: 'How rich are you?',
    func: async (client, msg, args, guildMember) => {
        if(!msg.mentions.users.first()) {
            try{await perms.check(guildMember, msg.channel.id, "credits.self")}catch(e) {return msg.channel.send(e.message)}
            let moneyName = await money.getName(msg.guild.id);
            let amount = await money.getAmount(msg.author.id, msg.guild.id);
            let embed = new Discord.RichEmbed()
                .setColor("GREEN")
                .setFooter('asked by ' + msg.author.tag)
                .setTimestamp()
                .setDescription(`${msg.author.toString()},You have ${amount} ${moneyName}`);
            msg.channel.send({embed});
        } else if(msg.mentions.users.first() !== msg.author){
            if(args.length > 1) {
                let amount;
                try{
                    amount = money.amount(args.slice(2, args.length-1));
                }
                catch(e){
                    let embed = new Discord.RichEmbed()
                        .setColor("RED")
                        .setFooter('asked by ' + msg.author.tag)
                        .setTimestamp()
                        .addField("Error:", e.message);
                    return msg.channel.send({embed});
                }
                try{await perms.check(guildMember, msg.channel.id, "credits.other")}catch(e) {return msg.channel.send(e.message)}
                let moneyName = await money.getName(msg.guild.id);
                let _money = await money.get(msg.author.id, msg.guild.id);
                let embed = new Discord.RichEmbed()
                    .setColor("GREEN")
                    .setFooter('asked by ' + msg.author.tag)
                    .setTimestamp()
                    .setDescription(`${msg.author.toString()}, You transferred ${parseInt(args[args.length-1])} ${moneyName} to ${msg.mentions.users.first().toString()}`);
                try {
                    await db.changeMoney(msg.guild.id, msg.author.id, -amount);
                }
                catch(e) {
                    return msg.channel.send(e.message);
                }
                //I don't try catch the receiving end because it can only increase(see error handling in money.amount)
                await db.changeMoney(msg.guild.id, msg.mentions.users.first().id, amount);
                msg.channel.send({embed});
            } else {
                try{await perms.check(guildMember, msg.channel.id, "credits.other")}catch(e) {return msg.channel.send(e.message)}
                let moneyName = await money.getName(msg.guild.id);
                let _money = await money.get(msg.mentions.users.first().id, msg.guild.id);
                let embed = new Discord.RichEmbed()
                    .setColor("GREEN")
                    .setFooter('asked by ' + msg.author.tag)
                    .setTimestamp()
                    .setDescription(`${msg.mentions.users.first()} has ${_money.amount} ${moneyName}`);
                msg.channel.send({embed});
            }
        } else {
            return msg.reply("You can't give money to yourself!");
        }

    }
};
module.exports.bitField = bitField;
/*
*
 .setFooter('asked by ' + msg.author.tag)
 .setTimestamp()*/
