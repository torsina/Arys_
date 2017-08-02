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
        //if(config.env === "dev") return;
        if(!msg.mentions.users.first()) {
            try{await perms.check(guildMember, msg.channel.id, "credits.self")}catch(e) {return msg.channel.send(e.message)}
            let moneyName = await money.getName(msg.guild.id);
            let _money = await money.get(msg.author.id, msg.guild.id);
            let embed = new Discord.RichEmbed()
                .setColor(0x00AE86)
                .setFooter('asked by ' + msg.author.tag)
                .setTimestamp()
                .setDescription(`<@${msg.author.id}>,You have ${_money.amount} ${moneyName}`);
            msg.channel.send({embed});
        } else if(msg.mentions.users.first() !== msg.author){
            if(args.length > 1) {
                if(parseInt(args[args.length-1]) < 0) return msg.channel.send("You can't send negative amounts");
                try{await perms.check(guildMember, msg.channel.id, "credits.other")}catch(e) {return msg.channel.send(e.message)}
                let moneyName = await money.getName(msg.guild.id);
                let _money = await money.get(msg.author.id, msg.guild.id);
                let embed = new Discord.RichEmbed()
                    .setColor(0x00AE86)
                    .setFooter('asked by ' + msg.author.tag)
                    .setTimestamp()
                    .setDescription(`${msg.author.toString()}, You transferred ${args[args.length-1]} ${moneyName} to ${msg.mentions.users.first().toString()}`);
                try {
                    await db.changeMoney(msg.guild.id, msg.author.id, -parseInt(args[args.length-1]));
                }
                catch(e) {
                    return msg.channel.send(e.message);
                }
                try {
                    await db.changeMoney(msg.guild.id, msg.mentions.users.first().id, parseInt(args[args.length-1]));
                }
                catch(e) {
                    return msg.channel.send(e.message);
                }
                msg.channel.send({embed});
            } else {
                try{await perms.check(guildMember, msg.channel.id, "credits.other")}catch(e) {return msg.channel.send(e.message)}
                let moneyName = await money.getName(msg.guild.id);
                let _money = await money.get(msg.mentions.users.first().id, msg.guild.id);
                let embed = new Discord.RichEmbed()
                    .setColor(0x00AE86)
                    .setFooter('asked by ' + msg.author.tag)
                    .setTimestamp()
                    .setDescription(`${msg.mentions.users.first()} has ${_money.amount} ${moneyName}`);
                msg.channel.send({embed});
            }
        } else {
            return msg.channel.send("You can't give money to yourself!")
        }

    }
};
module.exports.bitField = bitField;
/*
*
 .setFooter('asked by ' + msg.author.tag)
 .setTimestamp()*/
