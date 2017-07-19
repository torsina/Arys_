const log = module.exports = {};
const db = require('./rethinkdb');
const Discord = require('discord.js');
let settings;

log.importSetting = (setting) => {
    settings = setting;
};


log.init = (Client) => {
    Client.on('guildMemberAdd', async (member) => {
        if(settings.get(member.guild.id).logChannel && settings.get(member.guild.id).logChannel.join !== undefined) {
            let guildMember = await db.getGuildMember(member.guild.id, member.id);
            let embed = new Discord.RichEmbed()
                .setTimestamp()
                .setFooter(Client.users.get(member.id).tag)
                .setColor("GREEN")
                .setDescription(Client.users.get(member.id).toString() + " joined the server");
            if (guildMember && guildMember.listenedRoles) {
                let str = "";
                guildMember.listenedRoles.forEach(function (_role) {
                    member.addRole(_role).catch(console.error);
                    str += member.guild.roles.get(_role).name + "\n";
                });
                embed.addField("reapplying of roles upon user rejoining:", str);
            }
            settings.get(member.guild.id).logChannel.join.forEach(function (log) {
                Client.channels.get(log).send({embed});
            });
        }
    });
    Client.on('guildMemberRemove', async member => {
        if(settings.get(member.guild.id).logChannel && settings.get(member.guild.id).logChannel.leave !== undefined) {
            let auditLog = await member.guild.fetchAuditLogs({type: 22, limit: 1}); //banned
            auditLog = auditLog.entries.first();
            if (member.id !== auditLog.target.id) { //check if user removed was not banned to remove duplicates
                let guildMember = await db.getGuildMember(member.guild.id, member.id);
                let embed = new Discord.RichEmbed()
                    .setTimestamp()
                    .setFooter(Client.users.get(member.id).tag)
                    .setDescription(Client.users.get(member.id).toString() + " left the server");
                if (guildMember && guildMember.listenedRoles) {
                    let str = "";
                    guildMember.listenedRoles.forEach(function (_role) {
                        member.addRole(_role).catch(console.error);
                        str += member.guild.roles.get(_role).name + "\n";
                    });
                    embed.addField("Watched roles when user left:", str);
                }
                settings.get(member.guild.id).logChannel.leave.forEach(function (log) {
                    Client.channels.get(log).send({embed});
                });
            }
        }
    });
    Client.on('guildMemberUpdate', async (oldMember, newMember) => {
        if (settings.get(oldMember.guild.id).listenedRoles) {
            let guildMember = await db.getGuildMember(oldMember.guild.id, oldMember.id);
            settings.get(oldMember.guild.id).listenedRoles.forEach(async function (_role) {
                if (!oldMember.roles.has(_role) && newMember.roles.has(_role)) {
                    try {
                        await db.addGuildMemberListenedRole(oldMember.guild.id, oldMember.id, _role)
                    } catch (e) {
                        return
                    }
                    if (settings.get(oldMember.guild.id).logChannel && settings.get(oldMember.guild.id).logChannel.listenedRoles !== undefined) {
                        let embed = new Discord.RichEmbed()
                            .setTimestamp()
                            .setFooter(Client.users.get(oldMember.id).tag)
                            .setDescription(Client.users.get(oldMember.id).toString() + " got the watched role " + Client.guilds.get(oldMember.guild.id).roles.get(_role).name + ".");
                        settings.get(oldMember.guild.id).logChannel.listenedRoles.forEach(function (log) {
                            Client.channels.get(log).send({embed});
                        });
                    }
                }
                if (oldMember.roles.has(_role) && !newMember.roles.has(_role)) {
                    await db.deleteGuildMemberListenedRoles(oldMember.guild.id, oldMember.id, _role).catch(console.error);
                    if (settings.get(oldMember.guild.id).logChannel && settings.get(oldMember.guild.id).logChannel.listenedRoles !== undefined) {
                        let embed = new Discord.RichEmbed()
                            .setTimestamp()
                            .setFooter(Client.users.get(oldMember.id).tag)
                            .setDescription(Client.users.get(oldMember.id).toString() + " got the watched role " + Client.guilds.get(oldMember.guild.id).roles.get(_role).name + " removed.");
                        settings.get(oldMember.guild.id).logChannel.listenedRoles.forEach(function (log) {
                            Client.channels.get(log).send({embed});
                        });
                    }
                }
            });
        }
    });
    Client.on('guildBanAdd', async (guild, user) => {
        if(settings.get(guild.id).logChannel && settings.get(guild.id).logChannel.ban !== undefined) {
            let auditLog = await guild.fetchAuditLogs({type: 22, limit: 1}); //banned
            auditLog = auditLog.entries.first();
            let embed = new Discord.RichEmbed()
                .addField("User banned:", user.toString() + " was banned")
                .setTimestamp()
                .setColor("RED");
            if(guild.members.get(Client.user.id).permissions.has("VIEW_AUDIT_LOG")) {
                embed.addField("Reason:", auditLog.reason);
                embed.addField("Author", auditLog.executor.toString())
            } else {
                embed.addField("Details:", `":warning: Couldn't get the reason because I don't have the permission "View Audit Log".`);
            }
            settings.get(guild.id).logChannel.ban.forEach(function (log) {
                Client.channels.get(log).send({embed});
            });
        }
    })
};