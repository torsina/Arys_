const db = require("../../util/rethink");
const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        const { guildSetting, guildMember, guildMemberMap, BitField, isOwner } = context.message;
        let { debtor, creditor } = context.flags;
        let canNagativeTransfer;
        if (!debtor) debtor = context.author;
        if (!creditor) creditor = context.args[0];
        const transferedMoney = context.args[1];
        const display = new RichEmbed()
            .setTimestamp()
            .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
            .setColor("#93ef1f");
        if (transferedMoney < 0) {
            if (!isOwner) {
                canNagativeTransfer = BitField.checkBuilt("money.transfer.force", context.message.permissionFields);
                if (!canNagativeTransfer) {
                    const { embed } = new context.command.EmbedError(context, {
                        error: "permission.denied",
                        data: { node: "money.transfer.force" }
                    });
                    return context.channel.send(embed);
                }
            } else {
                canNagativeTransfer = true;
            }
        }
        debtor = await db.getGuildMember(debtor.id, context.guild.id, guildSetting);
        creditor = await db.getGuildMember(creditor.id, context.guild.id, guildSetting);
        try {
            debtor.money.editMoney(-transferedMoney, canNagativeTransfer);
            creditor.money.editMoney(transferedMoney, canNagativeTransfer);
        } catch (e) {
            const { embed } = new context.command.EmbedError(context, {
                error: e,
                data: { node: "money.transfer.force" }
            });
            return context.channel.send(embed);
        }
        await db.editGuildMember(debtor);
        await db.editGuildMember(creditor);
        display.setDescription(context.t("transfer.success", {
            debtor: context.guild.members.get(debtor.memberID).toString(),
            creditor: context.guild.members.get(creditor.memberID).toString(),
            value: transferedMoney,
            currency: guildSetting.money.name
        }));
        context.channel.send(display);
    },
    // creditor = recoit
    // debtor = donne
    guildOnly: true,
    flags: [{
        name: "debtor",
        type: "member",
        short: "d"
    }, {
        name: "creditor",
        type: "member",
        short: "c"
    }],
    argParser: async (message, args) => {
        try {
            args[0] = await message.command.resolver.member(args[0], message);
            args[1] = await message.command.resolver.int(args[1], message);
            return args.slice(0, 2);
        } catch (err) {
            throw err;
        }
    }
};

