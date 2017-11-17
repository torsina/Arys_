const db = require("../../util/rethink");
const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        const { GuildSetting, GuildMember } = context.message;
        const { min } = GuildSetting.money.bet;
        if (context.args[1] < GuildSetting.money.bet.min) {
            const { embed } = new context.command.EmbedError(context, { error: "bet.tooLow", data: { min: min } });
            return context.channel.send(embed);
        }
        let option;
        if (context.args[0].includes("h")) option = "head";
        else option = "tail";
        const random = Math.random();
        const win = context.args[1] * 0.98;
        GuildSetting.money.addBetUsed(context.args[1]);
        await db.editGuildSetting(GuildSetting.guildID, GuildSetting);
        try {
            if ((random <= 0.49 && option === "head") || (random <= 0.98 && random > 0.49 && option === "tail")) {
                GuildMember.money.editMoney(win);
                const embed = new RichEmbed()
                    .setTimestamp()
                    .setColor("GOLD")
                    .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
                    .setDescription(context.t("bet.win", { user: context.author.toString(), value: min, currency: GuildSetting.money.name }));
                context.channel.send(embed);
            } else {
                GuildMember.money.editMoney(-context.args[1]);
                const embed = new RichEmbed()
                    .setTimestamp()
                    .setColor("RED")
                    .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
                    .setDescription(context.t("bet.lost", { user: context.author.toString(), value: min, currency: GuildSetting.money.name }));
                context.channel.send(embed);
            }
            return await db.editGuildMember(GuildMember, true);
        } catch (err) {
            const error = {
                error: err.message,
                data: {
                    currency: GuildSetting.money.name
                }
            };
            const { embed } = new context.command.EmbedError(context, error);
            return context.channel.send(embed);
        }
    },
    guildOnly: true,
    args: [{
        name: "option",
        label: "h|head t|tail",
        type: "text",
        optional: false,
        correct: ["h", "head", "t", "tail"]
    }, {
        name: "value",
        label: "bet",
        type: "int",
        min: 0,
        optional: false
    }]
};

