const db = require("../../util/rethink");
const resolver = require("discord.js-wiggle/lib/resolver");
const { SHOP } = require("../../../util/constants");
const { RichEmbed } = require("discord.js");
const ImageHandling = require("../../../image/ImageHandling");
module.exports = {
    run: async (context) => { // eslint-disable-line complexity
        const { args, message: { guildSetting, guildMember } } = context;
        const { shop } = guildSetting;
        const currency = guildSetting.money.name;
        const successEmbed = new RichEmbed()
            .setTimestamp(new Date(context.message.createdTimestamp))
            .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
            .setColor("GREEN");
        let errorCategory, errorItem, errorPrice;
        try {
            switch (args[0]) {
                case "add": {
                    switch (args[1]) {
                        case "role": {

                        }
                    }
                    break;
                }
                case "edit": {
                    switch (args[1]) {
                        case "role": {

                        }
                    }
                    break;
                }
                case "delete": {
                    switch (args[1]) {
                        case "role": {

                        }
                    }
                    break;
                }
                case "buy": {
                    switch (args[1]) {
                        case "role": {

                        }
                    }
                    break;
                }
                case "sell": {
                    switch (args[1]) {
                        case "role": {

                        }
                    }
                    break;
                }
            }
        } catch (err) {
            if (err instanceof context.message.FriendlyError) {
                const error = {
                    error: err.message,
                    data: {
                        currency,
                        value: guildMember.money.amount,
                        user: context.author.toString(),
                        max: SHOP.maxPriceDigit
                    }
                };
                if (err.data) Object.assign(error.data, err.data);
                if (errorCategory) error.data.category = errorCategory;
                if (errorItem) error.data.item = errorItem;
                if (errorPrice) error.data.price = errorPrice;
                const { embed } = new context.command.EmbedError(context.message, error);
                return context.channel.send(embed);
            } else console.error(err);
        }
    },
    guildOnly: true,
    flags: [{
        name: "header",
        type: "text",
        short: "h"
    }, {
        name: "name",
        type: "text",
        short: "n"
    }, {
        name: "price",
        type: "int",
        min: 0,
        short: "p"
    }
        // header
        // name

        // price
    ],
    argParser: async (message, args) => {
        try {
            const { length } = args;
            switch (args[0]) {
                case "add": {
                    switch (args[1]) {
                        case "role": {
                            // 2 to length - 2 = role name; length - 1 = price
                            args[2] = args.slice(2, length - 2);
                            args[2] = await message.command.resolver.role(args[2], message);
                            args[3] = await message.command.resolver.int(args[length - 1], message, { min: 0, max: 999999999 });
                            return args.slice(0, 3);
                        }
                    }
                    break;
                }
                case "edit": {
                    switch (args[1]) {
                        case "role": {
                            args[2] = args.slice(2, length - 2);
                            args[2] = await message.command.resolver.role(args[2], message);
                            args[3] = await message.command.resolver.int(args[length - 1], message, { min: 0, max: 999999999 });
                            return args.slice(0, 3);
                        }
                    }
                    break;
                }
                case "delete": {
                    switch (args[1]) {
                        case "role": {
                            args[2] = args.slice(2, length - 1);
                            args[2] = await message.command.resolver.role(args[2], message);
                            return args.slice(0, 2);
                        }
                    }
                    break;
                }
                case "buy": {
                    switch (args[1]) {
                        case "role": {
                            args[2] = args.slice(2, length - 1);
                            args[2] = await message.command.resolver.role(args[2], message);
                            return args.slice(0, 2);
                        }
                    }
                    break;
                }
                case "sell": {
                    switch (args[1]) {
                        case "role": {
                            args[2] = args.slice(2, length - 1);
                            args[2] = await message.command.resolver.role(args[2], message);
                            return args.slice(0, 2);
                        }
                    }
                    break;
                }
            }
        } catch (err) {
            throw err;
        }
    }
};

async function send(context, resolvedCategory, embed, results) {
    for (let i = 0; i < results.length; i++) {
        const image = results[i];
        embed.setDescription(context.t("words.page", { current: i + 1, total: results.length }));
        if (resolvedCategory.category.url.length === 0) {
            embed.attachFile(image);
            const message = await context.channel.send(embed);
            message.attachments.forEach(attachment => {
                if (attachment.height) {
                    resolvedCategory.category.url[i] = attachment.proxyURL;
                }
            });
            await db.editGuildSetting(context.message.guildSetting.guildID, context.message.guildSetting);
        } else {
            embed.setImage(image);
            context.channel.send(embed);
        }
    }
}

function sort(items, option) {
    switch (option) {
        case "increasing": {
            items.sort((a, b) => b.price - a.price);
            break;
        }
        case "decreasing": {
            items.sort((a, b) => a.price - b.price);
            break;
        }
    }
    return items;
}