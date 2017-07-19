const perms = require('../util/perm');
const db = require('../util/rethinkdb');
const config = require('../config/config');
const Discord = require('discord.js');

const bitField = {
    help: 1 << 0,
    change: 1 << 1
};

module.exports = {
    help: "Do you think I'm not watching?",
    func: async (client, msg, args, guildMember) => {
        //if(config.env === "dev") return;
        try {
            await perms.check(guildMember, "jail.change")
        } catch (e) {
            return msg.channel.send(e.message)
        }
        if(!msg.guild.members.get(client.user.id).permissions.has("MANAGE_ROLES")) {
            return msg.channel.send("I can't start this feature because I don't have the Role manager permission.")
        }
        let embed = new Discord.RichEmbed()
            .setTimestamp()
            .setFooter("asked by " + msg.author.tag);
        switch (args[0]) {
            case "-set": {
                if (msg.mentions.roles.first()) {
                    try {
                        await db.createListenedRole(msg.guild.id, msg.mentions.roles.first().id);
                    } catch (e) {
                        embed.setDescription(e.message);
                        return msg.channel.send({embed})
                    }
                    embed.setDescription("the role " + msg.mentions.roles.first().name + " was added to the watch list");
                    msg.channel.send({embed});
                } else return msg.channel.send("Please tag the role you want to add to the watch list.");
                break;
            }
            case "-remove": {
                if (msg.mentions.roles.first()) {
                    try {
                        await db.deleteListenedRole(msg.guild.id, msg.mentions.roles.first().id);
                    } catch (e) {
                        embed.setDescription(e.message);
                        return msg.channel.send({embed})
                    }
                    embed.setDescription("the role " + msg.mentions.roles.first().name + " was removed from the watch list");
                    msg.channel.send({embed});
                } else return msg.channel.send("Please tag the role you want to add to the watch list.");
                break;
            }
            case "-list": {
                let array = await db.getListenedRole(msg.guild.id);
                let str = "";
                array.forEach(function (role) {
                    str += msg.guild.roles.get(role).name + "\n";
                });
                embed.addField("Role watch list: ", str);
                msg.channel.send({embed});
                break;
            }
        }
    }
};
module.exports.bitField = bitField;