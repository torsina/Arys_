const db = require("../../util/rethink");
const moment = require("moment");
const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        const { guildSetting, guildMember, guildMemberMap } = context.message;
        const embed = new RichEmbed()
            .setTimestamp()
            .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
            .setColor("#93ef1f");
        let locale, usedGuildMember, hasBonus;
        if (!context.args[0]) {
            locale = "daily.self";
            usedGuildMember = guildMember;
            hasBonus = false;
        } else {
            locale = "daily.other";
            usedGuildMember = guildMemberMap.get(context.args[0].id);
            hasBonus = true;
        }
        try {
            const moneyAdded = usedGuildMember.money.getDaily(hasBonus);
            await db.editGuildMember(usedGuildMember);
            embed.setDescription(context.t(locale, {
                user: context.author.toString(),
                value: moneyAdded,
                currency: guildSetting.money.name,
                taggedUser: context.args[0] ? context.args[0].toString() : "" }));
            //context.channel.send(embed);
        } catch (e) {
            console.log(e);
            if (e === "daily.tooSoon") {
                embed.setDescription(context.t(e, {
                    user: context.author.toString(),
                    time: moment.from(usedGuildMember.money.daily.lastGet).format(context.t("daily.timeDisplay"))
                }))
                    .setColor("RED");
                //context.channel.send(embed);
            }
        }
    },
    guildOnly: true,
    args: [{
        label: "member tag",
        type: "member",
        optional: true
    }]
};

