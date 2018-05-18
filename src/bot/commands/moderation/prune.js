const { RichEmbed } = require("discord.js");
const constants = require("../../../util/constants");
module.exports = {
    run: async (context) => {
        if (!context.guild.me.hasPermission("MANAGE_MESSAGES", false, true)) {
            const { embed } = new context.command.EmbedError(context, {
                error: "arys.lackPermission",
                data: { permission: "MANAGE_MESSAGES" }
            });
            return context.channel.send(embed);
        }
        if (!context.author.hasPermission("MANAGE_MESSAGES", false, true, true)) {
            const { embed } = new context.command.EmbedError(context, {
                error: "member.lackPermission",
                data: { permission: "MANAGE_MESSAGES" }
            });
            return context.channel.send(embed);
        }
        const amountToDelete = context.args[0];
        let counter = amountToDelete;
        while (amountToDelete > counter) {
            const mod = counter % 100;
            const deleting = (mod === 0) ? 100 : mod;
            counter -= deleting;
            const collectedMesages = await context.channel.fetchMessages({ limit: deleting });
            await context.channel.bulkDelete(collectedMesages, true);
        }
        const display = new RichEmbed()
            .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
            .setTimestamp()
            .setColor("GREEN")
            .setDescription(context.t("prune.success", { amount: amountToDelete }));
        return context.channel.send(display);
    },
    args: [
        {
            type: "int",
            label: "deleted messages",
            min: 0,
            max: constants.MAXCACHE.fetchMessages,
            optional: false
        }]
};