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
                        return msg.channel.send({embed});
                        break;
                }
                break;
            case "-money":
                switch(args[1]) {
                    case "--name":
                        if(args[2] && args[2].length < config.money.maxCharName) {
                            if(args[2] === config.money.name) {
                                return await db.deleteMoneyName(msg.guild.id).catch(console.error);
                            }
                            return await db.setMoneyName(msg.guild.id, args[2]).catch(console.error);
                        } else if(!args[2]) {
                            return msg.channel.send("Please add the new value at the end of the command.");
                        } else if(args[2].length > config.money.maxCharName) {
                            return msg.channel.send("The name you tried to set is too long.");
                        }
                        break;
                    case "--amount":
                        if(!isNaN(parseInt(args[2])) && parseInt(args[2]) < config.money.maxInt) {
                            if(parseInt(args[2]) === config.money.amount) {
                                return await db.deleteMoneyDefaultAmount(msg.guild.id).catch(console.error);
                            }
                            return await db.setMoneyDefaultAmount(msg.guild.id, parseInt(args[2])).catch(console.error);
                        } else if(!args[2]){
                            return msg.channel.send("Please add the new value at the end of the command.");
                        } else if(parseInt(args[2]) > config.money.maxInt) {
                            return msg.channel.send("The number you entered is too high.");
                        }
                        break;
                    case "--wait":
                        console.log(parseInt(args[2]));
                        console.log(args[2]);
                        console.log(config.money.maxInt);
                        console.log(typeof config.money.maxInt);
                        if(!isNaN(parseInt(args[2])) && parseInt(args[2]) < config.money.maxInt) {
                            if(parseInt(args[2]) * 1000 === config.money.wait) {
                                return await db.deleteMoneyWait(msg.guild.id).catch(console.error);
                            }
                            return await db.setMoneyWait(msg.guild.id, parseInt(args[2])*1000).catch(console.error);
                        } else if(!args[2]){
                            return msg.channel.send("Please add the new value at the end of the command.")
                        } else if(parseInt(args[2]) > config.money.maxInt) {
                            return msg.channel.send("The number you entered is too high.");
                        }
                        break;
                    case "--range":
                        if(args.indexOf("--from") === -1 && args.indexOf("--to") === -1) {
                            return msg.channel.send("Please use the arguments `--from` and `--to` to set a new range.")
                        }
                        let _min, _max;
                        if(args.indexOf("--from") !== -1) {
                            _min = parseInt(args[args.indexOf("--from")+1]);
                        }
                        if(args.indexOf("--to") !== -1) {
                            _max = parseInt(args[args.indexOf("--to")+1]);
                        }
                        if(isNaN(_min) || isNaN(_max)) {
                        return msg.channel.send("Please don't use letters to set the new range.");
                        }
                        if(_min > _max) {
                            return msg.channel.send("Please put a valid range.");
                        }
                        if(_min > config.money.maxInt || _max > config.money.maxInt) {
                            return msg.channel.send("The numbers you entered is too high.");
                        }
                        if(_min === config.money.range.min && _max === config.money.range.max) {
                            return await db.deleteMoneyRange(msg.guild.id).catch(console.error);
                        }
                        return await db.setMoneyRange(msg.guild.id, _min, _max).catch(console.error);
                        break;
                    default:
                        let setting = await db.getSetting(msg.guild.id).catch(console.error);
                        let name, amount, min, max, wait;
                        if(setting.money) {
                            name = setting.money.name || config.money.name;
                            amount = setting.money.amount || config.money.amount;
                            wait = (setting.money.wait || config.money.wait);
                            if(setting.money.range) {
                                min = setting.money.range.min || config.money.range.min;
                                max = setting.money.range.max || config.money.range.max;
                            } else {
                                min = config.money.range.min;
                                max = config.money.range.max;
                            }
                        } else {
                            name = config.money.name;
                            amount = config.money.amount;
                            wait = config.money.wait;
                            min = config.money.range.min;
                            max = config.money.range.max;
                        }

                        let embed = new Discord.RichEmbed()
                            .setTitle('Money settings')
                            .addField('name of the currency:', name)
                            .addField('default amount of money:', amount)
                            .addField('wait between money earned by being active:', wait/1000 + " seconds")
                            .addField('range of money earned by being active', `[${min} to ${max}]`);
                        return msg.channel.send({embed});
                        break;
                }
        }
    }
};
