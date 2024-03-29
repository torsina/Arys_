const db = require("../../util/rethink");
const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        const { guildSetting, guildMember, guildMemberMap } = context.message;
        const display = new RichEmbed()
            .setTimestamp()
            .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
            .setColor("#93ef1f");
        let locale, usedGuildMember;
        if (!context.args[0]) {
            locale = "credits.self";
            usedGuildMember = guildMember;
        } else {
            locale = "credits.other";
            usedGuildMember = guildMemberMap.get(context.args[0].id);
            if (!usedGuildMember) usedGuildMember = await db.getGuildMember(context.args[0].id, context.guild.id, guildSetting);
        }
        display.setDescription(context.t(locale, {
            user: context.guild.members.get(usedGuildMember.memberID).toString(),
            value: usedGuildMember.money.amount,
            currency: guildSetting.money.name }));
        context.channel.send(display);
    },
    guildOnly: true,
    argParser: async (message, args) => {
        try {
            if (args.length > 0) {
                args[0] = await message.command.resolver.member(args[1], message);
                return args.slice(0, 1);
            } else return [];
        } catch (err) {
            throw err;
        }
    }
};

