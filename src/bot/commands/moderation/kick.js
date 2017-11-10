const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        if (context.args[0].kickable) {
            if (context.member.hasPermission("KICK_MEMBERS", false, true, true)) {
                const embed = new RichEmbed()
                    .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
                    .setTimestamp()
                    .setColor("GREEN")
                    .setDescription(context.t("kick.success", { member: context.args[0].toString() }));
                context.args[0].kick(context.args[1]);
                context.channel.send(embed);
            } else {
                const error = {
                    error: "member.lackPermission",
                    data: {
                        permission: "KICK_MEMBERS"
                    }
                };
                const { embed } = new context.command.EmbedError(context.message, error);
                context.channel.send(embed);
            }
        } else if (context.guild.me.hasPermission("KICK_MEMBERS", false, true, true)) {
            const error = {
                error: "kick.botTooLow",
                data: {
                    member: context.args[0].toString()
                }
            };
            const { embed } = new context.command.EmbedError(context.message, error);
            context.channel.send(embed);
        } else {
            const error = {
                error: "arys.lackPermission",
                data: {
                    permission: "KICK_MEMBERS"
                }
            };
            const { embed } = new context.command.EmbedError(context.message, error);
            context.channel.send(embed);
        }
    },
    flags: [
        {
            name: "reason",
            short: "r",
            type: "text",
            // discord's char limit for kick reasons
            max: 512
        }
    ],
    args: [
        {
            type: "member",
            label: "member",
            optional: false
        }]
};