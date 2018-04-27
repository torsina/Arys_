const db = require("../../util/rethink");
const resolver = require("discord.js-wiggle/lib/resolver");
const { SHOP } = require("../../../util/constants");
const { RichEmbed } = require("discord.js");
const ImageHandling = require("../../../image/ImageHandling");
module.exports = {
    run: async (context) => { // eslint-disable-line complexity
        const { guildSetting, guildMember } = context.message;
        console.log(guildSetting);
        const { shop } = guildSetting;
        const currency = guildSetting.money.name;
        const successEmbed = new RichEmbed()
            .setTimestamp(new Date(context.message.createdTimestamp))
            .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
            .setColor("GREEN");
        let errorCategory, errorItem, errorPrice;
        try {
            switch (context.args[0]) {
                case "add": {
                    switch (context.args[1]) {
                        case "category": {
                            switch (context.args[2]) {
                                case "role": {
                                    const type = context.args[2];
                                    errorCategory = context.args[3];
                                    shop.addCategory(type, errorCategory);
                                    successEmbed.setDescription(context.t("shop.category.success.add", {
                                        type,
                                        category: errorCategory
                                    }));
                                    context.channel.send(successEmbed);
                                    await db.editGuildSetting(guildSetting.guildID, guildSetting);
                                    break;
                                }
                            }
                            break;
                        }
                        case "item": {
                            // check le type de la category et faire en fonction de sa
                            // add item <category> <price> <item>
                            errorCategory = context.args[2];
                            const resolvedCategory = shop.checkCategory(context.args[2], true);
                            errorCategory = resolvedCategory.category.name;
                            switch (resolvedCategory.category.type) {
                                case "role": {
                                    const role = await resolver.role(context.args[4], context.message);
                                    errorItem = role.name;
                                    errorPrice = context.args[3];
                                    shop.addItem(resolvedCategory.index, { id: role.id, price: errorPrice });
                                    successEmbed.setDescription(context.t("shop.item.success.add.role", {
                                        role: role.name,
                                        category: resolvedCategory.category.name,
                                        price: errorPrice,
                                        currency
                                    }));
                                    context.channel.send(successEmbed);
                                    await db.editGuildSetting(guildSetting.guildID, guildSetting);
                                    break;
                                }
                            }
                        }
                    }
                    break;
                }
                case "edit": {
                    errorCategory = context.args[2];
                    const resolvedCategory = shop.checkCategory(context.args[2], true);
                    errorCategory = resolvedCategory.category.name;
                    switch (context.args[1]) {
                        case "category": {
                            // edit category <category> <flag options...>
                            const item = shop.editCategory(resolvedCategory.index, context.flags);
                            const optionsKeys = Object.keys(item.options);
                            successEmbed.addField("name", item.name)
                                .addField("type", item.type);
                            for (let i = 0, n = optionsKeys.length; i < n; i++) {
                                const optionKey = optionsKeys[i];
                                const optionValue = context.flags[optionKey];
                                successEmbed.addField(optionKey, optionValue);
                            }
                            successEmbed.setDescription(context.t("shop.category.success.edit", {
                                category: resolvedCategory.category.name
                            }));
                            console.log("shop", guildSetting);
                            break;
                        }
                        case "item": {
                            // edit item <category> <item> <flag options...>
                            switch (resolvedCategory.category.type) {
                                case "role": {
                                    const role = await resolver.role(context.args[3], context.message);
                                    errorItem = role.name;
                                    errorPrice = context.args[3];
                                    const item = shop.editItem(errorCategory, role.id, context.flags);
                                    successEmbed.addField("name", role.toString());
                                    const optionsKeys = Object.keys(item);
                                    for (let i = 0, n = optionsKeys.length; i < n; i++) {
                                        const optionKey = optionsKeys[i];
                                        if (optionKey === "id") continue;
                                        const optionValue = context.flags[optionKey];
                                        successEmbed.addField(optionKey, optionValue);
                                    }
                                    successEmbed.setDescription(context.t("shop.item.success.edit.role", {
                                        role: role.name,
                                        category: resolvedCategory.category.name
                                    }));
                                    break;
                                }
                            }
                            break;
                        }
                    }
                    await db.editGuildSetting(guildSetting.guildID, guildSetting);
                    context.channel.send(successEmbed);
                    break;
                }
                case "remove": {
                    switch (context.args[1]) {
                        case "category": {
                            errorCategory = context.args[2];
                            const result = shop.deleteCategory(errorCategory);
                            successEmbed.setDescription(context.t("shop.category.success.remove", {
                                type: result,
                                category: errorCategory
                            }));
                            context.channel.send(successEmbed);
                            await db.editGuildSetting(guildSetting.guildID, guildSetting);
                            break;
                        }
                        case "item": {
                            // delete item <category> <item>
                            errorCategory = context.args[2];
                            const resolvedCategory = shop.checkCategory(context.args[2], true);
                            errorCategory = resolvedCategory.category.name;
                            switch (resolvedCategory.category.type) {
                                case "role": {
                                    const role = await resolver.role(context.args[3], context.message);
                                    errorItem = role.name;
                                    errorPrice = context.args[3];
                                    shop.deleteItem(resolvedCategory.index, role.id);
                                    successEmbed.setDescription(context.t("shop.item.success.remove.role", {
                                        role: role.name,
                                        category: resolvedCategory.category.name,
                                        price: errorPrice,
                                        currency
                                    }));
                                    break;
                                }
                            }
                            context.channel.send(successEmbed);
                            await db.editGuildSetting(guildSetting.guildID, guildSetting);
                            break;
                        }
                    }
                    break;
                }
                case undefined: {
                    const balanceString = context.t("money.balance", { user: context.message.author.toString(), amount: guildMember.money.amount, currency });
                    if (shop.shopArray.length > 0) {
                        for (let i = 0, n = shop.shopArray.length; i < n; i++) {
                            const _shop = shop.shopArray[i];
                            const fieldTitle = _shop.options.header ? _shop.options.header : _shop.name;
                            let fieldDesc = "";
                            if (_shop.options.desc) fieldDesc += `${_shop.options.desc}\n`;
                            fieldDesc += context.t("shop.list.desc", { name: _shop.name, type: _shop.type });
                            successEmbed.addField(fieldTitle, fieldDesc)
                                .setDescription(balanceString);
                        }
                    } else {
                        throw new context.message.FriendlyError("shop.noCategory", { currencyDisplay: balanceString });
                    }
                    context.channel.send(successEmbed);
                    break;
                }
                default: {
                    errorCategory = context.args[0];
                    const resolvedCategory = shop.checkCategory(errorCategory, true);
                    errorCategory = resolvedCategory.category.name; // eslint-disable-line prefer-destructuring
                    const maxItems = SHOP.maxPerPage;
                    const pages = Math.ceil(resolvedCategory.category.items.length / maxItems);
                    const allItems = resolvedCategory.category.items.slice();
                    resolvedCategory.category.items = sort(allItems, resolvedCategory.category.options.order);
                    const requests = [];
                    const promises = [];
                    const results = [];
                    switch (resolvedCategory.category.type) {
                        case "role": {
                            if (resolvedCategory.category.url.length === 0 && pages !== 0) {
                                for (let i = 0; i < pages; i++) {
                                    const items = allItems.slice(i * maxItems, (i + 1) * maxItems);
                                    const itemsCopy = [];
                                    for (let j = 0; j < items.length; j++) {
                                        const _item = items[j];
                                        itemsCopy[j] = {};
                                        const _itemCopy = itemsCopy[j];
                                        Object.assign(itemsCopy[j], _item);
                                        const role = context.guild.roles.get(_item.id);
                                        _itemCopy.hex = role.hexColor === "#000000" ? "#FFFFFF" : role.hexColor;
                                        _itemCopy.name = role.name;
                                    }
                                    requests[i] = {
                                        type: resolvedCategory.category.type,
                                        items: itemsCopy
                                    };
                                }
                                for (let i = 0; i < pages; i++) {
                                    promises[i] = ImageHandling.startProcess(requests[i]);
                                }
                                Promise.all(promises).then(async (images) => {
                                    results.push(...images);
                                    await send(context, resolvedCategory, successEmbed, results);
                                });
                            } else if (pages !== 0) {
                                await send(context, resolvedCategory, successEmbed, resolvedCategory.category.url);
                            } else {
                                throw new context.message.FriendlyError("shop.noItems");
                            }
                        }
                    }

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
    argTree: {
        last: true,
        choice: {
            VALUE: null,
            add: {
                choice: {
                    category: {
                        choice: {
                            role: {
                                choice: {
                                    VALUE: null
                                }
                            }
                        }
                    },
                    item: {
                        label: "category name",
                        choice: {
                            VALUE: {
                                choice: {
                                    type: "int",
                                    min: 0,
                                    label: "price",
                                    choice: {
                                        VALUE: {
                                            last: true,
                                            label: "item name",
                                            choice: { VALUE: null }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            edit: {
                choice: {
                    category: {
                        label: "category name",
                        choice: {
                            VALUE: null
                        }
                    },
                    item: {
                        label: "category name",
                        choice: {
                            VALUE: {
                                label: "item name",
                                last: true,
                                choice: { VALUE: null }
                            }
                        }
                    }
                }
            },
            remove: {
                choice: {
                    category: {
                        label: "category name",
                        choice: { VALUE: null }
                    },
                    item: {
                        label: "category name",
                        choice: {
                            VALUE: {
                                label: "item name",
                                last: true,
                                choice: { VALUE: null }
                            }
                        }
                    }
                }
            }
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