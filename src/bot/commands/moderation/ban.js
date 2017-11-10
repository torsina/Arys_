const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        if (context.args[0].bannable) {
            if (context.member.hasPermission("BAN_MEMBERS", false, true, true)) {
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
                        permission: "BAN_MEMBERS"
                    }
                };
                const { embed } = new context.command.EmbedError(context.message, error);
                context.channel.send(embed);
            }
        } else if (context.guild.me.hasPermission("BAN_MEMBERS", false, true, true)) {
            const error = {
                error: "ban.botTooLow",
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
                    permission: "BAN_MEMBERS"
                }
            };
            const { embed } = new context.command.EmbedError(context.message, error);
            context.channel.send(embed);
        }
    },
    flags: [
        {
            name: "deleteMessageDays",
            short: "d",
            type: "int",
            min: 0,
            max: 7
        }, {
            name: "reason",
            short: "r",
            type: "text",
            // discord's limit for ban reasons
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