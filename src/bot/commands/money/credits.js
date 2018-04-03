const db = require("../../util/rethink");
const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        const { guildSetting, guildMember, guildMemberMap } = context.message;
        const display = new RichEmbed()
            .setTimestamp()
            .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
            .setColor("#93ef1f");
        if (!context.args[0]) {
            display.setDescription(context.t("credits.self", { user: context.author.toString(), value: guildMember.money.amount, currency: guildSetting.money.name }));
        } else {
            let taggedGuildMember = guildMemberMap.get(context.args[0].id);
            if (!taggedGuildMember) taggedGuildMember = await db.getGuildMember(context.args[0].id, context.guild.id, guildSetting);
            switch (context.args[1]) {
                case "check": {
                    display.setDescription(context.t("credits.other", { user: context.args[0].toString(), value: taggedGuildMember.money.amount, currency: guildSetting.money.name }));
                    break;
                }
                default: {
                    const parsedAmount = parseInt(context.args[1]);
                    if (isNaN(parsedAmount)) {
                        const { embed } = new context.command.EmbedError(context.message, { error: "wiggle.resolver.error.NaN" });
                        return context.channel.send(embed);
                    } else if (parsedAmount < 0) {
                        const { embed } = new context.command.EmbedError(context.message, { error: "wiggle.resolver.error.belowMin", data: { min: 0 } });
                        return context.channel.send(embed);
                    } else {
                        guildMember.money.editMoney(-parsedAmount);
                        taggedGuildMember.money.editMoney(parsedAmount);
                        aw
                    }
                }
            }
        }
        context.channel.send(display);
    },
    guildOnly: true,
    args: [{
        label: "member tag",
        type: "member",
        optional: true
    }, {
        label: "amount | check",
        optional: true
    }]
};

