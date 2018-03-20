const db = require("../../util/rethink");
const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        const { guildSetting, GuildMember, GuildMemberMap } = context.message;
        const embed = new RichEmbed()
            .setTimestamp()
            .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
            .setColor("#93ef1f");
        if (!context.args[0]) {
            embed.setDescription(context.t("credits.self", { user: context.author.toString(), value: GuildMember.money.amount, currency: guildSetting.money.name }));
            context.channel.send(embed);
        } else {
            let taggedGuildMember = GuildMemberMap.get(context.args[0].id);
            if (!taggedGuildMember) taggedGuildMember = await db.getGuildMember(context.args[0].id, context.guild.id, guildSetting);
            embed.setDescription(context.t("credits.self", { user: context.args[0].toString(), value: taggedGuildMember.money.amount, currency: guildSetting.money.name }));
        }
    },
    guildOnly: true,
    args: [{
        label: "member tag",
        type: "member",
        optional: true
    }]
};

