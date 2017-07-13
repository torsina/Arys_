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
        if(!msg.mentions.users) {
            try{await perms.check(guildMember, "credits.self")}catch(e) {return msg.channel.send(e.message)}
            let setting = await db.getSetting(msg.guild.id);
            let _money = await money.get(msg.author.id, msg.guild.id);
            let embed = new Discord.RichEmbed()
                .setColor(0x00AE86)
                .setFooter('asked by ' + msg.author.tag)
                .setTimestamp();
            if(setting.money && setting.money.name) {
                embed.setDescription(`<@${msg.author.id}>,You have ${_money.amount} ${setting.money.name}`);
            } else {
                embed.setDescription(`<@${msg.author.id}>,You have ${_money.amount} ${config.money.name}`);
            }
            msg.channel.send({embed});
        } else {
            try{await perms.check(guildMember, "credits.other")}catch(e) {return msg.channel.send(e.message)}
            let setting = await db.getSetting(msg.guild.id);
            let embed = new Discord.RichEmbed()
                .setColor(0x00AE86)
                .setFooter('asked by ' + msg.author.tag)
                .setTimestamp();
            if(setting.money && setting.money.name) {
                embed.setDescription(`<@${msg.author.id}>,You transferred ${_money.amount} ${setting.money.name} to <@${msg.mentions.users.first().id}>`);
            } else {
                embed.setDescription(`<@${msg.author.id}>,You transferred ${_money.amount} ${config.money.name} to <@${msg.mentions.users.first().id}>`);
            }
            await db.changeMoney(msg.guild.id, msg.mentions.users.first().id, args[args.length-1]).catch(e => msg.channel.send(e.message));
            msg.channel.send({embed});
        }

    }
};
module.exports.bitField = bitField;
/*
*
 .setFooter('asked by ' + msg.author.tag)
 .setTimestamp()*/
