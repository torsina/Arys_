const db = require("../../util/rethink");
const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        const { GuildSetting, GuildMember, GuildMemberMap } = context.message;
        const embed = new RichEmbed()
            .setTimestamp()
            .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
            .setColor("#93ef1f");
        if (!context.args[0]) {
            embed.setDescription(context.t("credits.self", { user: context.author.toString(), value: GuildMember.money.amount, currency: GuildSetting.money.name }));
            context.channel.send(embed);
        } else {
            let taggedGuildMember = GuildMemberMap.get(context.args[0].id);
            if (!taggedGuildMember) taggedGuildMember = await db.getGuildMember(context.args[0].id, context.guild.id, GuildSetting);
            embed.setDescription(context.t("credits.self", { user: context.args[0].toString(), value: taggedGuildMember.money.amount, currency: GuildSetting.money.name }));
        }
    },
    guildOnly: true,
    args: [{
        name: "user",
        label: "user tag",
        type: "member",
        optional: true,
        correct: ["h", "head", "t", "tail"]
    }]
};

