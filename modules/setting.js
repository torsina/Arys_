const config = require('../config/config');
const db = require('../util/rethinkdb');
const perms = require('../util/perm');
const Discord = require('discord.js');

let logList = [
    {name: 'join', desc: 'Trigger each time an user joins the guild.'},
    {
        name: 'leave',
        desc: 'Trigger each time a user leaves the guild.\n:warning: Without the "View Audit Log" perm, all banned and kicked users will show here as well.'
    },
    {
        name: 'ban',
        desc: 'Trigger each time a user gets banned.\n:warning: Without the "View Audit Log" perm, the reason and the author of the ban will not show up.'
    },
    {name: 'listenedRoles', desc: 'Trigger each time a user leave or join while he had a listened role on him'}];
let logMap = new Map();
for(let setting of logList) {
    logMap.set(setting.name, setting);
}

const bitField = {
    help: 1 << 0,
    prefix_change: 1 << 1,
    prefix_see: 1 << 2,
    log_change: 1 << 3,
    log_see: 1 << 4,
    money_see: 1 << 5,
    money_amount: 1 << 6,
    money_wait: 1 << 7,
    money_range: 1 << 8,
    money_name: 1 << 9,
    perm_role_set: 1 << 10,
    perm_role_see: 1 << 11,
    perm_role_copy: 1 << 12,
    perm_see: 1 << 13,
    money_daily: 1 << 14
};

module.exports = {
    help: 'Custom all the things!',
    func: async (client, msg, args, guildMember) => {
        //if(config.env === "dev") return;
        switch(args[0]) {
            case "-prefix":
                switch (args[1]) {
                    case "--reset":
                        try{await perms.check(guildMember, "setting.prefix.change")}catch(e) {return msg.channel.send(e.message)}
                        await db.deletePrefix(msg.guild.id);
                        return msg.channel.send("Your customized prefix has been removed.");
                        break;
                    case "--set":
                        try{await perms.check(guildMember, "setting.prefix.change")}catch(e) {return msg.channel.send(e.message)}
                        await await db.setPrefix(msg.guild.id, args[2]).catch(console.error);
                        return msg.channel.send("My prefix for this server is now `" + args[2] + "`.");
                        break;
                    default:
                        try{await perms.check(guildMember, "setting.prefix.see")}catch(e) {return msg.channel.send(e.message)}
                        return msg.channel.send(await db.getPrefix()); //TODO make embed for that
                        break;
                }
                break;
            case "-log":{
                switch (args[1]) {
                    case "--add": {
                        //0 = -log; 1 = --add; 2 = channel; 3 = log
                        try{await perms.check(guildMember, "setting.log.change")}catch(e) {return msg.channel.send(e.message)}
                        let log;
                        for(let validLog of logList) {
                            if(validLog.name === args[3]) {
                                log = args[3];
                            }
                        }
                        if(!log) return msg.channel.send("This log type doesn't exist, please refer to `$setting -log --list` for a list of all the log");
                        if (msg.mentions.channels.first() !== undefined) await db.addLogChannel(msg.guild.id, msg.mentions.channels.first().id, log)
                            .catch((e) => {
                                console.error(e);
                                msg.channel.send(e.message)
                            });
                        else return msg.channel.send("please tell in which channel you want me to log this");
                        break;
                    }
                    case "--remove":{
                        try{await perms.check(guildMember, "setting.log.change")}catch(e) {return msg.channel.send(e.message)}
                        let log;
                        for(let validLog of logList) {
                            if(validLog.name === args[3]) {
                                log = args[3];
                            }
                        }
                        if(!log) return msg.channel.send("This log type doesn't exist, please refer to `$setting -log` for a list of all the log");
                        if (msg.mentions.channels.first() !== undefined) await db.removeLogChannel(msg.guild.id, msg.mentions.channels.first().id, log)
                            .catch((e) => {
                                console.error(e);
                                msg.channel.send(e.message)
                            });
                        else return msg.channel.send("please tell in which channel you want me to stop sending this");
                        break;
                    }
                    case "--list":{
                        try{await perms.check(guildMember, "setting.log.see")}catch(e) {return msg.channel.send(e.message)}
                        let doc = await db.getLogChannel(msg.guild.id);
                        if (!doc.logChannel) return msg.channel.send("there is 0 log channels currently on this server");
                        else {
                            let embed = new Discord.RichEmbed()
                                .setTitle('Log channels: ')
                                .setColor("GOLD")
                                .setFooter('asked by ' + msg.author.tag)
                                .setTimestamp();
                            let channelMap = new Map;
                            let types = Object.keys(doc.logChannel);
                            for(let type of types) {
                                doc.logChannel[type].forEach(function (c) {
                                    console.log("triggered" + type + " " + c);
                                    if(!channelMap.get(c)) channelMap.set(c, [type]);
                                    else {
                                        let doc = channelMap.get(c);
                                        if(doc.indexOf(type) < 0) {
                                            doc.push(type);
                                        }
                                    }
                                });
                            }
                            console.log(channelMap);
                            let snowflakes = channelMap.keys();
                            console.log(typeof snowflakes);
                            channelMap.forEach(function (value, key) {
                                embed.addField(client.channels.get(key).name + ":", value);
                            });
                            return msg.channel.send({embed})
                        }
                        break;
                    }
                    default:{
                        let main = new Discord.RichEmbed()
                            .setTitle('Log commands: ')
                            .setColor(0x00AE86)
                            .setFooter('asked by ' + msg.author.tag)
                            .setTimestamp()
                            .setDescription("How to:")
                            .addField("Add a log channel:", "`$setting -log --add <channel> <log>`")
                            .addField("Remove a log channel:", "`$setting -log --remove <channel> <log>`")
                            .addField("List the log channels:", "`$setting -log --list`");
                        let embed = new Discord.RichEmbed()
                            .setTitle('Log options: ')
                            .setColor(0x00AE86)
                            .setFooter('asked by ' + msg.author.tag)
                            .setTimestamp();
                        for (let log of logList) {
                            embed.addField(log.name, log.desc);
                        }
                        msg.channel.send({embed: main});
                        msg.channel.send({embed});
                        break;
                    }
                }
                break;
            }
            case "-money":{
                switch (args[1]) {
                    case "--name":
                        try{await perms.check(guildMember, "setting.money.name")}catch(e) {return msg.channel.send(e.message)}
                        if (args[2] && args[2].length < config.money.maxCharName) {
                            if (args[2] === config.money.name) {
                                return await db.deleteMoneyName(msg.guild.id).catch(console.error);
                            }
                            return await db.setMoneyName(msg.guild.id, args[2]).catch(console.error);
                        } else if (!args[2]) {
                            return msg.channel.send("Please add the new value at the end of the command.");
                        } else if (args[2].length > config.money.maxCharName) {
                            return msg.channel.send("The name you tried to set is too long.");
                        }
                        break;
                    case "--amount":
                        try{await perms.check(guildMember, "setting.money.amount")}catch(e) {return msg.channel.send(e.message)}
                        if (!isNaN(parseInt(args[2])) && parseInt(args[2]) < config.money.maxInt) {
                            if (parseInt(args[2]) === config.money.amount) {
                                return await db.deleteMoneyDefaultAmount(msg.guild.id).catch(console.error);
                            }
                            return await db.setMoneyDefaultAmount(msg.guild.id, parseInt(args[2])).catch(console.error);
                        } else if (!args[2]) {
                            return msg.channel.send("Please add the new value at the end of the command.");
                        } else if (parseInt(args[2]) > config.money.maxInt) {
                            return msg.channel.send("The number you entered is too high.");
                        }
                        break;
                    case "--wait":
                        try{await perms.check(guildMember, "setting.money.wait")}catch(e) {return msg.channel.send(e.message)}
                        console.log(parseInt(args[2]));
                        console.log(args[2]);
                        console.log(config.money.maxInt);
                        console.log(typeof config.money.maxInt);
                        if (!isNaN(parseInt(args[2])) && parseInt(args[2]) < config.money.maxInt) {
                            if (parseInt(args[2]) * 1000 === config.money.wait) {
                                return await db.deleteMoneyWait(msg.guild.id).catch(console.error);
                            }
                            return await db.setMoneyWait(msg.guild.id, parseInt(args[2]) * 1000).catch(console.error);
                        } else if (!args[2]) {
                            return msg.channel.send("Please add the new value at the end of the command.")
                        } else if (parseInt(args[2]) > config.money.maxInt) {
                            return msg.channel.send("The number you entered is too high.");
                        }
                        break;
                    case "--range":
                        try{await perms.check(guildMember, "setting.money.range")}catch(e) {return msg.channel.send(e.message)}
                        if (args.indexOf("--from") === -1 && args.indexOf("--to") === -1) {
                            return msg.channel.send("Please use the arguments `--from` and `--to` to set a new range.")
                        }
                        let _min, _max;
                        if (args.indexOf("--from") !== -1) {
                            _min = parseInt(args[args.indexOf("--from") + 1]);
                        }
                        if (args.indexOf("--to") !== -1) {
                            _max = parseInt(args[args.indexOf("--to") + 1]);
                        }
                        if (isNaN(_min) || isNaN(_max)) {
                            return msg.channel.send("Please don't use letters to set the new range.");
                        }
                        if (_min > _max) {
                            return msg.channel.send("Please put a valid range.");
                        }
                        if (_min > config.money.maxInt || _max > config.money.maxInt) {
                            return msg.channel.send("The numbers you entered is too high.");
                        }
                        if (_min === config.money.range.min && _max === config.money.range.max) {
                            return await db.deleteMoneyRange(msg.guild.id).catch(console.error);
                        }
                        return await db.setMoneyRange(msg.guild.id, _min, _max).catch(console.error);
                        break;
                    case "--daily": {
                        try{await perms.check(guildMember, "setting.money.daily")}catch(e) {return msg.channel.send(e.message)}
                        if (!isNaN(parseInt(args[2])) && parseInt(args[2]) < config.money.maxInt) {
                            if (parseInt(args[2]) === config.money.daily.amount) {
                                return await db.deleteMoneyDaily(msg.guild.id).catch(console.error);
                            }
                            console.log("triggered");
                            return await db.setMoneyDaily(msg.guild.id, parseInt(args[2])).catch(console.error);
                        } else if (!args[2]) {
                            return msg.channel.send("Please add the new value at the end of the command.")
                        } else if (parseInt(args[2]) > config.money.maxInt) {
                            return msg.channel.send("The number you entered is too high.");
                        }
                        break;
                    }
                    default:
                        try{await perms.check(guildMember, "setting.money.see")}catch(e) {return msg.channel.send(e.message)}
                        let setting = await db.getSetting(msg.guild.id).catch(console.error);
                        let name, amount, min, max, wait, daily_amount, daily_min, daily_max;
                        if (setting.money) {
                            name = setting.money.name || config.money.name;
                            amount = setting.money.amount || config.money.amount;
                            wait = (setting.money.wait || config.money.wait);
                            if (setting.money.range) {
                                min = setting.money.range.min || config.money.range.min;
                                max = setting.money.range.max || config.money.range.max;
                            } else {
                                min = config.money.range.min;
                                max = config.money.range.max;
                            }
                            if(setting.money.daily) {
                                daily_amount = setting.money.daily.amount || config.money.daily.amount;
                                if(setting.money.daily.range) {
                                    daily_min = setting.money.daily.range.min || config.money.daily.range.min;
                                    daily_max = setting.money.daily.range.max || config.money.daily.range.max;
                                } else {
                                    daily_min = config.money.daily.range.min;
                                    daily_max = config.money.daily.range.max;
                                }
                            } else {
                                daily_amount = config.money.daily.amount;
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
                            .addField('wait between money earned by being active:', wait / 1000 + " seconds")
                            .addField('range of money earned by being active', `[${min} to ${max}]`)
                            .addField('money earned by daily', daily_amount)
                            .addField('range of bonus money earned by daily to other', `[${daily_min} to ${daily_max}]`);
                        return msg.channel.send({embed});
                        break;
                }
                break;
            }
            case "-perm":{
                switch(args[1]) {
                    case "--role": {
                        try{await perms.check(guildMember, "setting.perm.role.set")}catch(e) {return msg.channel.send(e.message)}
                        //0 = -perm; 1 = --role; 2 = type; 3 = role; 4 = perm
                        let array = [];
                        for(let i=0;i<args.length;i++) {
                            if (i > 2 && i < args.length - 1) array.push(args[i]);
                        }
                        let roleName = array.join(" ");
                        let role = msg.guild.roles.find("name", roleName);
                        if(!role) return msg.channel.send("This role does not exist or is not wrote properly\n:warning: case sensitive");
                        let perm = args[args.length-1];
                        let type = args[2];
                        let value = await perms.addToRole(msg.guild.id, role.id, perm, msg, type).catch(console.error);
                        if(value === true)msg.channel.send("The permission " + perm + " is now " + type + "ed for the role " + role.name + ".");
                        if(value === false)msg.channel.send("The permission " + perm + " is no more " + type + "ed for the role " + role.name + ".");
                        let doc = await db.getRolePerm(msg.guild.id, role.id);
                        console.log(doc);
                        break;
                    }
                    case "--see": {
                        try{await perms.check(guildMember, "setting.perm.see")}catch(e) {return msg.channel.send(e.message)}
                        let array = [];
                        for(let i=0;i<args.length;i++) {
                            if (i > 1 && i <= args.length - 1) array.push(args[i]);
                        }
                        let roleName = array.join(" ");
                        let id = msg.guild.roles.find("name", roleName).id;
                        console.log(id);
                        let role = await db.getRolePerm(msg.guild.id, id);
                        console.log(role);
                        let permArray = [];
                        let bitFields = perms.getBitField();
                        let commands = Object.keys(bitFields);
                        for(let command of commands) {
                            let obj = bitFields[command];
                            let perms = Object.keys(obj);
                            for(let perm of perms) {
                                console.log(command);
                                if(role.perm && role.perm[command] && !!(role.perm[command].allow & bitFields[command][perm])) {
                                    perm = perm.split("_");
                                    perm = perm.join(".");
                                    permArray.push(":white_check_mark:\t" +command + "." + perm + "\n");
                                } else {
                                    perm = perm.split("_");
                                    perm = perm.join(".");
                                    permArray.push(":x:\t" + command + "." + perm + " \n");
                                }
                            }
                        }
                        let permString = "";
                        permArray.forEach(function (p) {
                            permString += p;
                        });
                        let embed = new Discord.RichEmbed()
                            .setTitle("Allowed perms for the role " + roleName)
                            .setDescription(permString)
                            .setFooter('asked by ' + msg.author.tag)
                            .setTimestamp();
                        msg.channel.send({embed});

                        break;
                    }
                    case "--copy": {
                        let copyNameArray = args.slice(2, args.length);
                        let copyName = copyNameArray.join(" ");
                        let copyId = msg.guild.roles.find("name", copyName);
                        let copyRole = await db.getRolePerm(msg.guild.id, copyId.id);
                        console.log(copyRole + " jjjj");
                        let filter = m => m.author.id === msg.author.id;
                        let copiedName = await msg.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
                            .catch(collected => msg.channel.send(`Sorry, you took too much time to select a role`));
                        copiedName = copiedName.first().content;
                        let copiedId = msg.guild.roles.find("name", copiedName);
                        if(!copiedId) return msg.channel.send("No such role found\n:warning: Case sensitive");
                        await db.setRolePerm(msg.guild.id, copiedId.id, copyRole.perm, msg);
                        break;
                    }
                    case undefined: {
                        try{await perms.check(guildMember, "setting.perm.see")}catch(e) {return msg.channel.send(e.message)}
                        let permArray = [];
                        let bitFields = perms.getBitField();
                        let commands = Object.keys(bitFields);
                        for(let command of commands) {
                            let obj = bitFields[command];
                            let perms = Object.keys(obj);
                            for(let perm of perms) {
                                perm = perm.split("_");
                                perm = perm.join(".");
                                permArray.push(command + "." + perm + "\n")
                            }
                        }
                        let permString = "";
                        permArray.forEach(function (p) {
                            permString += p;
                        });
                        msg.channel.send("```\n" + permString+ "```");
                        break;
                    }
                }
                break;
            }
        }//end switch args[0]
    }
};
module.exports.bitField = bitField;