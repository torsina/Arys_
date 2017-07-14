const perms = require('../util/perm');
const money = require('../util/money');
const config = require('../config/config');
const Discord = require('discord.js');

const bitField = {
    help: 1 << 0,
    base: 1 << 1
};

module.exports = {
    help: 'Monies for everyone!',
    func: async(client, msg, args,  guildMember) => {
        //if(config.env === "dev") return;
        try{await perms.check(guildMember, "daily.base")}catch(e) {return msg.channel.send(e.message)}
        if(guildMember.daily && guildMember.daily + 86400000 < Date.now() || !guildMember.daily) {//guildMember.daily && guildMember.daily + 86400000 < Date.now() //guildMember.daily && guildMember.daily + 86400000 < Date.now() || !guildMember.daily
            let setting = await db.getSetting(msg.guild.id).catch(console.error);
            let prefix = setting.money.name || config.money.name;
            if(!msg.mentions.users.first()) {
                let daily = await money.getDaily(msg.guild.id, msg.author.id).catch(console.error);
                let embed = new Discord.RichEmbed()
                    .setColor(0x00AE86)
                    .setFooter('asked by ' + msg.author.tag)
                    .setTimestamp()
                    .setDescription(msg.author.toString() + " you received your daily " + daily + " " + prefix);
                msg.channel.send({embed});
            } else if(msg.mentions.users.first() !== msg.author && msg.mentions.users.first() !== msg.author.bot) {
                let daily = await money.getDaily(msg.guild.id, msg.mentions.users.first().id, true).catch(console.error);
                let embed = new Discord.RichEmbed()
                    .setColor(0x00AE86)
                    .setFooter('asked by ' + msg.author.tag)
                    .setTimestamp()
                    .setDescription(msg.author.toString() + " you gave your " + daily + " " + prefix + " dailies to " + msg.mentions.users.first().toString());
                msg.channel.send({embed});
            }
        } else {
            let future = guildMember.daily + 86400000 - Date.now();
            let x;
            x = future / 1000;
            let seconds = x % 60;
            x /= 60;
            let minutes = x % 60;
            x /= 60;
            let hours = x % 24;
            //msg.channel.send(Math.floor(hours) + " " + Math.floor(minutes) + " " + Math.floor(seconds));
            msg.channel.send("You can get your next dailies in " + Math.floor(hours) + " hours, " + Math.floor(minutes) + " minutes and " + Math.floor(seconds) + " seconds.")
        }

    }
};
module.exports.bitField = bitField;