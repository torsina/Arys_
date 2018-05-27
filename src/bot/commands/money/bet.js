const db = require("../../util/rethink");
const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        const { guildSetting, guildMember, betCount } = context.message;
        const { min } = guildSetting.money.bet;
        if (context.args[1] < guildSetting.money.bet.min) {
            const { embed } = new context.command.EmbedError(context, { error: "bet.tooLow", data: { min: min } });
            return context.channel.send(embed);
        }
        console.log(context.args);
        let option;
        if (context.args[0].includes("h")) option = "head";
        else option = "tail";
        const random = Math.random();
        const win = context.args[1] * 0.98;
        await db.addBetCount(guildSetting.guildID, betCount + context.args[1]);
        try {
            if ((random <= 0.49 && option === "head") || (random <= 0.98 && random > 0.49 && option === "tail")) {
                guildMember.money.editMoney(win);
                const embed = new RichEmbed()
                    .setTimestamp()
                    .setColor("GOLD")
                    .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
                    .setDescription(context.t("bet.win", { user: context.author.toString(), value: min, currency: guildSetting.money.name }));
                context.channel.send(embed);
            } else {
                guildMember.money.editMoney(-context.args[1], true);
                const embed = new RichEmbed()
                    .setTimestamp()
                    .setColor("RED")
                    .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
                    .setDescription(context.t("bet.lost", { user: context.author.toString(), value: min, currency: guildSetting.money.name }));
                context.channel.send(embed);
            }
            return await db.editGuildMember(guildMember, true);
        } catch (err) {
            const error = {
                error: err.message,
                data: {
                    currency: guildSetting.money.name
                }
            };
            const { embed } = new context.command.EmbedError(context, error);
            return context.channel.send(embed);
        }
    },
    guildOnly: true,
    argParser: async (message, args) => {
        try {
            args[0] = (args[0].toLowerCase().includes("h")) ? "head" : "tail";
            args[1] = await message.command.resolver.int(args[1], message);
            return args.slice(0, 2);
        } catch (err) {
            throw err;
        }
    }
};

