const perms = require('../util/perm');
const config = require('../config/config');
const db = require('../util/rethinkdb');
const Discord = require('discord.js');

const bitField = {
    help: 1 << 0,
    set: 1 << 1, //add a role to the user
    list: 1 << 2, //give the list of the giveme roles
    add: 1 << 3, //add a role to the list
    delete: 1 << 4
};

module.exports = {
    help: 'Give me all dem roles!',
    func: async(client, msg, args,  guildMember) => {
        //if(config.env === "dev") return;
        switch(args[0]) {
            case "-set": {
                try{await perms.check(guildMember, msg.channel.id, "giveme.set")}catch(e) {return msg.channel.send(e.message)}
                let array = args.slice();
                delete array[0];
                let nameInput = array.join(" ");
                nameInput = nameInput.substr(1);
                let role = msg.guild.roles.find("name", nameInput);
                if(role) {
                    let doc = await db.getAutoRole(msg.guild.id, role.id);
                    if(doc) {
                        msg.guild.members.get(msg.author.id).addRole(role.id).catch(console.error);
                        let embed = new Discord.RichEmbed()
                            .setDescription("I added you the role " + role.name)
                            .setColor("BLUE")
                            .setFooter('asked by ' + msg.author.tag)
                            .setTimestamp();
                        return msg.channel.send({embed});
                    } else {
                        let embed = new Discord.RichEmbed()
                            .setDescription("The role you asked was not found in my list, please check the role list with \n`$giveme -list`")
                            .setColor("RED")
                            .setFooter('asked by ' + msg.author.tag)
                            .setTimestamp();
                        return msg.channel.send({embed});
                    }
                } else {
                    let embed = new Discord.RichEmbed()
                        .setDescription("The role you asked was not found, please check the role list with \n`$giveme -list` TEST")
                        .setColor("RED")
                        .setFooter('asked by ' + msg.author.tag)
                        .setTimestamp();
                    return msg.channel.send({embed});
                }
            }
            case "-list": {
                try{await perms.check(guildMember, msg.channel.id, "giveme.list")}catch(e) {return msg.channel.send(e.message)}
                let doc = await db.getAutoRoles(msg.guild.id);
                if(doc.length === 0) {
                    let embed = new Discord.RichEmbed()
                        .setDescription("There is no role in my list yet, you can add one using\n`$giveme -add <role>`")
                        .setColor("RED")
                        .setFooter('asked by ' + msg.author.tag)
                        .setTimestamp();
                    return msg.channel.send({embed});
                }
                let str = "";
                doc.forEach(function (_role) {
                    str += msg.guild.roles.get(_role.role).name + "\n"
                });
                return msg.channel.send(str, {disableEveryone: true, code: true, split: true});
            }
            case "-add": {
                try{await perms.check(guildMember, msg.channel.id, "giveme.add")}catch(e) {return msg.channel.send(e.message)}
                let array = args.slice();
                delete array[0];
                let nameInput = array.join(" ");
                nameInput = nameInput.substr(1);
                let role = msg.guild.roles.find("name", nameInput);
                if(role) {
                    await db.createAutoRole(msg.guild.id, role.id);
                    let embed = new Discord.RichEmbed()
                        .setDescription("I added the role " + role.name)
                        .setColor("BLUE")
                        .setFooter('asked by ' + msg.author.tag)
                        .setTimestamp();
                    return msg.channel.send({embed});
                } else {
                    let embed = new Discord.RichEmbed()
                        .setDescription("The role you used was not found, please check the role list with \n`$giveme -list`")
                        .setColor("RED")
                        .setFooter('asked by ' + msg.author.tag)
                        .setTimestamp();
                    return msg.channel.send({embed});
                }
            }
            case "-delete": {
                try{await perms.check(guildMember, msg.channel.id, "giveme.delete")}catch(e) {return msg.channel.send(e.message)}
                let array = args.slice();
                delete array[0];
                let nameInput = array.join(" ");
                nameInput = nameInput.substr(1);
                let role = msg.guild.roles.find("name", nameInput);
                if(role) {
                    let embed = new Discord.RichEmbed()
                        .setDescription("I deleted you the role " + role.name)
                        .setColor("BLUE")
                        .setFooter('asked by ' + msg.author.tag)
                        .setTimestamp();
                    await db.deleteAutoRole(msg.guild.id, role.id).catch(e => {
                        embed.setDescription(e.message);
                    });
                    return msg.channel.send({embed});
                } else {
                    let embed = new Discord.RichEmbed()
                        .setDescription("The role you used was not found, please check the role list with \n`$giveme -list`")
                        .setColor("RED")
                        .setFooter('asked by ' + msg.author.tag)
                        .setTimestamp();
                    return msg.channel.send({embed});
                }
            }
        }
    }
};
module.exports.bitField = bitField;