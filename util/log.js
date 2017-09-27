const log = module.exports = {};
const db = require('./rethinkdb');
const Discord = require('discord.js');
const config = require('../config/config');
const moment = require('moment');
let settings;

log.importSetting = (setting) => {
    settings = setting;
};

log.init = (Client) => {
    Client.on('guildMemberAdd', async (member) => {
        if (settings.get(member.guild.id).logChannel && settings.get(member.guild.id).logChannel.join !== undefined) {
            const guildMember = await db.getGuildMember(member.guild.id, member.id);
            const embed = new Discord.RichEmbed()
                .setTimestamp()
                .setFooter(Client.users.get(member.id).tag)
                .setColor("GREEN")
                .setDescription(`${Client.users.get(member.id).toString()} joined the server`);
            if (guildMember && guildMember.listenedRoles) {
                let str = "";
                guildMember.listenedRoles.forEach((_role) => {
                    member.addRole(_role).catch(console.error);
                    str += `${member.guild.roles.get(_role).name}\n`;
                });
                embed.addField("reapplying of roles upon user rejoining:", str);
            }
            settings.get(member.guild.id).logChannel.join.forEach((logMessage) => {
                Client.channels.get(logMessage).send({embed});
            });
        }
    });
    Client.on('guildMemberRemove', async member => {
        if (settings.get(member.guild.id).logChannel && settings.get(member.guild.id).logChannel.leave !== undefined) {
            let kickAuditLog = await member.guild.fetchAuditLogs({type: 20, limit: 1});
            kickAuditLog = kickAuditLog.entries.first();
            if (kickAuditLog && member.id === kickAuditLog) {
                //check if user was kicked
                const embed = new Discord.RichEmbed()
                    .setTimestamp()
                    .setColor("ORANGE")
                    .addField("User kicked:", member.toString())
                    .addField("Reason:", kickAuditLog.reason)
                    .addField("Author", kickAuditLog.executor.toString());
                settings.get(member.guild.id).logChannel.kick.forEach((logMessage) => {
                    Client.channels.get(logMessage).send({embed});
                });
                return;
                //to not go through the ban check
            }
            let banAuditLog = await member.guild.fetchAuditLogs({type: 22, limit: 1});
            banAuditLog = banAuditLog.entries.first();
            if (banAuditLog && member.id !== banAuditLog.target.id) {
                //check if user removed was not banned to remove duplicates
                //this is the case where the user left on his own
                const guildMember = await db.getGuildMember(member.guild.id, member.id);
                const embed = new Discord.RichEmbed()
                    .setTimestamp()
                    .setFooter(Client.users.get(member.id).tag)
                    .setDescription(`${Client.users.get(member.id).toString()} left the server`);
                if (guildMember && guildMember.listenedRoles) {
                    //check if the guildMember had listened roles
                    let str = "";
                    guildMember.listenedRoles.forEach((_role) => {
                        member.addRole(_role).catch(console.error);
                        str += `${member.guild.roles.get(_role).name}\n`;
                    });
                    embed.addField("Watched roles when user left:", str);
                }
                settings.get(member.guild.id).logChannel.leave.forEach((logMessage) => {
                    Client.channels.get(logMessage).send({embed});
                });
            }
        }
    });
    Client.on('guildMemberUpdate', async (oldMember, newMember) => {
        if (settings.get(oldMember.guild.id).listenedRoles) {
            settings.get(oldMember.guild.id).listenedRoles.forEach(async (_role) => {
                if (!oldMember.roles.has(_role) && newMember.roles.has(_role)) {
                    try {
                        await db.addGuildMemberListenedRole(oldMember.guild.id, oldMember.id, _role);
                    } catch (e) {
                        return;
                    }
                    if (settings.get(oldMember.guild.id).logChannel && settings.get(oldMember.guild.id).logChannel.listenedRoles !== undefined) {
                        const embed = new Discord.RichEmbed()
                            .setTimestamp()
                            .setFooter(Client.users.get(oldMember.id).tag)
                            .setDescription(`${oldMember.toString()} got the watched role ${oldMember.guild.roles.get(_role).name}.`);
                        settings.get(oldMember.guild.id).logChannel.listenedRoles.forEach((logMessage) => {
                            Client.channels.get(logMessage).send({embed});
                        });
                    }
                }
                if (oldMember.roles.has(_role) && !newMember.roles.has(_role)) {
                    await db.deleteGuildMemberListenedRoles(oldMember.guild.id, oldMember.id, _role).catch(console.error);
                    if (settings.get(oldMember.guild.id).logChannel && settings.get(oldMember.guild.id).logChannel.listenedRoles !== undefined) {
                        const embed = new Discord.RichEmbed()
                            .setTimestamp()
                            .setFooter(Client.users.get(oldMember.id).tag)
                            .setDescription(`${oldMember.toString()} got the watched role ${oldMember.guild.roles.get(_role).name} removed.`);
                        settings.get(oldMember.guild.id).logChannel.listenedRoles.forEach((logMessage) => {
                            Client.channels.get(logMessage).send({embed});
                        });
                    }
                }
            });
        }
    });
    Client.on('guildBanAdd', async (guild, user) => {
        if (settings.get(guild.id).logChannel && settings.get(guild.id).logChannel.ban !== undefined) {
            let auditLog = await guild.fetchAuditLogs({type: 22, limit: 1});
            auditLog = auditLog.entries.first();
            const embed = new Discord.RichEmbed()
                .addField("User banned:", user.toString())
                .setTimestamp()
                .setColor("RED");
            if (guild.members.get(Client.user.id).permissions.has("VIEW_AUDIT_LOG")) {
                embed.addField("Reason:", auditLog.reason)
                    .addField("Author", auditLog.executor.toString());
            } else {
                embed.addField("Details:", `":warning: Couldn't get the reason because I don't have the permission "View Audit Log".`);
            }
            settings.get(guild.id).logChannel.ban.forEach((logMessage) => {
                Client.channels.get(logMessage).send({embed});
            });
        }
    });
    Client.on('message', async msg => {
        if (msg.content.includes(config.bug)) {
            msg.delete();
            if (settings.get(msg.guild.id).logChannel && settings.get(msg.guild.id).logChannel.bug !== undefined) {
                const embed = new Discord.RichEmbed()
                    .addField("User who used the crash:", Client.users.get(msg.author.id).toString())
                    .setTimestamp()
                    .setColor("RED")
                    .setFooter(Client.users.get(msg.author.id).tag);
                settings.get(msg.guild.id).logChannel.bug.forEach((logMessage) => {
                    Client.channels.get(logMessage).send({embed});
                });
            }
        }
    });
    Client.on('messageDelete', async msg => {
        if (settings.get(msg.guild.id).logChannel && settings.get(msg.guild.id).logChannel.messageDelete !== undefined) {
            let messageDeletedAuditLog = await msg.guild.fetchAuditLogs({type: 72, limit: 3});
            messageDeletedAuditLog = messageDeletedAuditLog.entries.filter((auditLog) => {
                return auditLog.target.id === msg.author.id && auditLog.extra.channel.id === msg.channel.id;
            }).first();
            const executor = messageDeletedAuditLog ? msg.guild.members.get(messageDeletedAuditLog.executor.id).toString() : msg.author.toString();
            const content = msg.content || "<embed>";
            const embed = new Discord.RichEmbed()
                .setTitle("Message Deleted")
                .addField("Age:", moment(msg.createdAt).format("ddd, D MMM Y H:mm:ss Z"))
                .addField("Author:", msg.author.toString(), true)
                .addField("Channel:", msg.channel.toString(), true)
                .addField("Content:", ` \`\`\` ${content} \`\`\` `)
                .setColor("DARK_RED")
                .setTimestamp();
            msg.attachments.array().forEach((attachment) => {
                if (attachment.height) {
                    embed.setImage(attachment.proxyURL);
                } else {
                    embed.addField("Attachment:", attachment.url);
                }
            });
            embed.addField("Deleted by:", executor);
            settings.get(msg.guild.id).logChannel.messageDelete.forEach((logMessage) => {
                Client.channels.get(logMessage).send({embed});
            });
        }
    });
};