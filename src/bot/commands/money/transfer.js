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
        if (transferedMoney < 0) {
            if (!isOwner) {
                canNagativeTransfer = BitField.checkBuilt("money.transfer.force", context.message.permission);
                if (!canNagativeTransfer) {
                    const { embed } = new context.command.EmbedError(context, {
                        error: "permission.denied",
                        data: { node: "money.transfer.force" }
                    });
                    return context.channel.send(embed);
                }
            }
        }
        debtor = await db.getGuildMember(debtor.id, context.guild.id, guildSetting);
        creditor = await db.getGuildMember(creditor.id, context.guild.id, guildSetting);
        try {
            debtor.money.editMoney(-transferedMoney, canNagativeTransfer);
            creditor.money.editMoney(transferedMoney, canNagativeTransfer);
        } catch (e) {

        }
        await db.editGuildMember(debtor);
        await db.editGuildMember(creditor);
        const { embed } = new context.command.EmbedError(context, { error: "transfer.success",
            data: { debtor: context.guild.members.get(debtor.memberID).toString(),
                creditor: context.guild.members.get(creditor.memberID).toString(),
                value: transferedMoney,
                currency: guildSetting.money.name }, color: "GREEN" });
        context.channel.send(embed);
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
    args: [{
        label: "member tag",
        type: "member",
        optional: false
    }, {
        label: "amount",
        type: "int",
        optional: false
    }]
};

