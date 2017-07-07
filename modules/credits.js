const perms = require('../config/perm/perms');
const config = require('../config/config');
const money = require('../util/money');
const db = require('../util/rethinkdb');
const Discord = require('discord.js');

module.exports = {
    help: 'How rich are you?',
    func: async (client, msg, args, role) => {
        //if(config.env === "dev") return;
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
    }
};
/*
*
 .setFooter('asked by ' + msg.author.tag)
 .setTimestamp()*/
