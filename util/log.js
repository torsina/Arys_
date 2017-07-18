const log = module.exports = {};
const db = require('./rethinkdb');
const Discord = require('discord.js');
let settings;

log.importSetting = (setting) => {
    settings = setting;
};


log.init = (Client) => {
    Client.on('guildMemberAdd', member => {
        if(settings.get(member.guild.id).logChannel && settings.get(member.guild.id).logChannel.join !== undefined) {
            settings.get(member.guild.id).logChannel.join.forEach(function (log) {
                Client.channels.get(log).send(Client.users.get(member.id).toString() + " joined the server");
            });
        }
    });
    Client.on('guildMemberRemove', async member => {
        if(settings.get(member.guild.id).logChannel && settings.get(member.guild.id).logChannel.leave !== undefined) {
            let auditLog = await member.guild.fetchAuditLogs({type: 22, limit: 1}); //banned
            auditLog = auditLog.entries.first();
            if(member.id !== auditLog.target.id) {
                settings.get(member.guild.id).logChannel.leave.forEach(function (log) {
                    Client.channels.get(log).send(Client.users.get(member.id).toString() + " left the server");
                });
            }
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