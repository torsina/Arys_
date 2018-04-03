const db = require("../../util/rethink");
const constants = require("../../../util/constants");
const { RichEmbed } = require("discord.js");
const moment = require("moment");
module.exports = {
    run: async (context) => {
        const { guildSetting } = context.message;
        const { money } = guildSetting;
        switch (context.args[0]) {
            case "show": {
                // we do this to prevent the embed from printing null
                const betMax = money.bet.max === null ? "Infinity" : money.bet.max;
                const embed = new RichEmbed()
                    .setColor("GOLD")
                    .setTimestamp()
                    .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
                    .setTitle(context.t("currency.show.title"))
                    .addField(context.t("currency.show.name"), money.name)
                    .addField(context.t("currency.show.bet.range"), `[${money.bet.min}-${betMax}]`)
                    .addField(context.t("currency.show.daily.amount"), money.daily.amount)
                    .addField(context.t("currency.show.daily.bonus"), `[${money.daily.bonusRange.min}-${money.daily.bonusRange.max}]`)
                    .addField(context.t("currency.show.activity.wait"), moment(money.activity.wait).format("H:m:s"))
                    .addField(context.t("currency.show.activity.bonus"), `[${money.activity.min}-${money.activity.max}]`);
                context.channel.send(embed);
                return;
            }
            case "accounts": {
                switch (context.args[1]) {
                    case "amount": {
                        money.setAccountsAmount(context.args[2]);
                        const { embed } = new context.command.EmbedError(context, { error: "currency.success",
                            data: { option: context.t("currency.option.accounts.amount"), value: context.args[2] }, color: "GREEN" });
                        context.channel.send(embed);
                        break;
                    }
                }
                break;
            }
            case "name": {
                money.setName(context.args[1]);
                const { embed } = new context.command.EmbedError(context, { error: "currency.success",
                    data: { option: context.t("currency.option.name"), value: context.args[1] }, color: "GREEN" });
                context.channel.send(embed);
                break;
            }
            case "bet": {
                switch (context.args[1]) {
                    case "min": {
                        money.setBetRange({ min: context.args[2] });
                        const { embed } = new context.command.EmbedError(context, { error: "currency.success",
                            data: { option: context.t("currency.option.bet.min"), value: context.args[2] }, color: "GREEN" });
                        context.channel.send(embed);
                        break;
                    }
                    case "max": {
                        money.setBetRange({ max: context.args[2] });
                        const { embed } = new context.command.EmbedError(context, { error: "currency.success",
                            data: { option: context.t("currency.option.bet.max"), value: context.args[2] }, color: "GREEN" });
                        context.channel.send(embed);
                        break;
                    }
                }
                break;
            }
            case "daily": {
                switch (context.args[1]) {
                    case "amount": {
                        money.setDailyAmount(context.args[2]);
                        const { embed } = new context.command.EmbedError(context, { error: "currency.success",
                            data: { option: context.t("currency.option.daily.amount"), value: context.args[2] }, color: "GREEN" });
                        context.channel.send(embed);
                        break;
                    }
                    case "min": {
                        money.setDailyBonusRange({ min: context.args[2] });
                        const { embed } = new context.command.EmbedError(context, { error: "currency.success",
                            data: { option: context.t("currency.option.daily.min"), value: context.args[2] }, color: "GREEN" });
                        context.channel.send(embed);
                        break;
                    }
                    case "max": {
                        money.setDailyBonusRange({ max: context.args[2] });
                        const { embed } = new context.command.EmbedError(context, { error: "currency.success",
                            data: { option: context.t("currency.option.daily.max"), value: context.args[2] }, color: "GREEN" });
                        context.channel.send(embed);
                        break;
                    }
                }
                break;
            }
            case "activity": {
                switch (context.args[1]) {
                    case "wait": {
                        money.setActivityWait(context.args[2]);
                        const { embed } = new context.command.EmbedError(context, { error: "currency.success",
                            data: { option: context.t("currency.option.activity.wait"), value: context.args[2] }, color: "GREEN" });
                        context.channel.send(embed);
                        break;
                    }
                    case "min": {
                        money.setActivityRange({ min: context.args[2] });
                        const { embed } = new context.command.EmbedError(context, { error: "currency.success",
                            data: { option: context.t("currency.option.activity..min"), value: context.args[2] }, color: "GREEN" });
                        context.channel.send(embed);
                        break;
                    }
                    case "max": {
                        money.setActivityRange({ max: context.args[2] });
                        const { embed } = new context.command.EmbedError(context, { error: "currency.success",
                            data: { option: context.t("currency.option.activity.max"), value: context.args[2] }, color: "GREEN" });
                        context.channel.send(embed);
                        break;
                    }
                }
            }
        }
        await db.editGuildSetting(guildSetting.guildID, guildSetting, true);
    },
    guildOnly: true,
    argTree: {
        choice: {
            show: null,
            name: {
                max: constants.GUILDSETTING_DEFAULT.moneyNameLength,
                choice: { VALUE: null }
            },
            accounts: {
                choice: {
                    amount: {
                        type: "int",
                        min: 0,
                        choice: { VALUE: null }
                    }
                }
            },
            bet: {
                choice: {
                    min: {
                        type: "int",
                        min: constants.GUILDSETTING_DEFAULT.money.bet.min,
                        choice: { VALUE: null }
                    },
                    max: {
                        type: "int",
                        min: constants.GUILDSETTING_DEFAULT.money.bet.min + 1,
                        choice: { VALUE: null }
                    }
                }
            },
            daily: {
                type: "text",
                choice: {
                    amount: {
                        type: "int",
                        min: 0,
                        choice: { VALUE: null }
                    },
                    min: {
                        type: "int",
                        min: 0,
                        choice: { VALUE: null }
                    },
                    max: {
                        type: "int",
                        min: 0,
                        choice: { VALUE: null }
                    }
                }
            },
            activity: {
                type: "text",
                next: {
                    wait: {
                        type: "timespan",
                        choice: { VALUE: null }
                    },
                    min: {
                        type: "int",
                        min: 0,
                        choice: { VALUE: null }
                    },
                    max: {
                        type: "int",
                        min: 0,
                        choice: { VALUE: null }
                    }
                }
            }
        }
    }
};