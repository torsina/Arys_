const perms = require('../config/perm/perms');
const config = require('../config/config');
const db = require('../util/rethinkdb');
const Discord = require('discord.js');

let logList = [
    {name: 'guildMemberAdd',desc: 'trigger each time a user join the guild' ,arg: 'optional'},
    {name: 'guildMemberUpdate',desc: 'trigger each time the roles of a user are changed', arg: 'needed'}];
let logMap = new Map();
for(let setting of logList) {
    logMap.set(setting.name, setting);
}
module.exports = {
    help: 'Custom all the things!',
    func: async (client, msg, args, role) => {//TODO make perm for that command
        //if(config.env === "dev") return;
        console.log(logMap);
        switch(args[0]) {
            case "-prefix":
                switch(args[1]) {
                    case "--reset":
                        await db.deletePrefix(msg.guild.id);
                        return msg.channel.send("Your customized prefix has been removed.");
                        break;
                    case "--set":
                        await await db.setPrefix(msg.guild.id, args[2]).catch(console.error);
                        return msg.channel.send("My prefix for this server is now `"+ args[2] +"`.");
                        break;
                    default:
                        return msg.channel.send(await db.getPrefix()); //TODO make embed for that
                        break;
                }
                break;
            case "-log":
                switch(args[1]) {
                    case "--add":
                        if(log)
                        if(msg.mentions.channels.first() !== undefined) await db.addLogChannel(msg.guild.id, msg.mentions.channels.first().id, "guildMemberAdd")
                            .catch((e) => {
                            console.error(e);
                            msg.channel.send(e.message)});
                        else return msg.channel.send("please tell in which channel you want me to log this");
                        break;
                    case "--remove":
                        if(msg.mentions.channels.first() !== undefined) await db.removeLogChannel(msg.guild.id, msg.mentions.channels.first().id, "guildMemberAdd")
                            .catch((e) => {
                                console.error(e);
                                msg.channel.send(e.message)});
                        else return msg.channel.send("please tell in which channel you want me to stop sending this");
                        break;
                    case "--list":
                        let doc = await db.getLogChannel(msg.guild.id);
                        console.log(doc);
                        console.log(doc.logChannel);
                        if(doc.logChannel === undefined) return msg.channel.send("there is 0 log channels currently on this server");
                        else return console.log(doc.logChannel);
                        console.log(doc);
                        break;
                    default:
                        let embed = new Discord.RichEmbed()
                            .setTitle('Log options: ')
                            .setColor(0x00AE86)
                            .setFooter('asked by ' + msg.author.tag)
                            .setTimestamp()
                            .addField('\u200b', '\u200b');
                        for(let setting of logList) {
                            embed.addField(setting.name, setting.desc + "\narguments : " + setting.arg);
                        }
                        msg.channel.send({embed});
                }
        }
    }
};
