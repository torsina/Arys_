const db = require("../../util/rethink");
const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        const { guildSetting, guildMember, guildMemberMap } = context.message;
        const display = new RichEmbed()
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
            if (!usedGuildMember) usedGuildMember = await db.getGuildMember(context.args[0].id, context.guild.id, guildSetting);
            hasBonus = true;
        }
        if (guildMember.money.daily.isAvailable) {
            guildMember.money.setDailyCooldown();
            const moneyAdded = usedGuildMember.money.getDaily(hasBonus);
            await db.editGuildMember(usedGuildMember);
            if (usedGuildMember.memberID !== guildMember.memberID) {
                await db.editGuildMember(guildMember);
            }
            display.setDescription(context.t(locale, {
                user: context.author.toString(),
                value: moneyAdded,
                currency: guildSetting.money.name,
                taggedUser: context.args[0] ? context.args[0].toString() : "" }));
            context.channel.send(display);
        } else {
            const { embed } = new context.command.EmbedError(context, { error: "daily.tooSoon",
                data: {
                    user: context.author.toString(),
                    time: context.t("daily.timeDisplay", parsedTime(guildMember.money.daily.lastGet))
                } });
            context.channel.send(embed);
        }
    },
    guildOnly: true,
    argParser: async (message, args) => {
        try {
            args[0] = await message.command.resolver.member(args[1], message);
            return args.slice(0, 1);
        } catch (err) {
            throw err;
        }
    }
};

function parsedTime(lastGet) {
    const free = lastGet + 86400000 - Date.now();
    let x;
    x = free / 1000;
    const s = Math.floor(x % 60);
    x /= 60;
    const m = Math.floor(x % 60);
    x /= 60;
    const h = Math.floor(x % 24);
    return { s, m, h };
}

