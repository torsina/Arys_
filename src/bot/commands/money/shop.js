const db = require("../../util/rethink");
const resolver = require("discord.js-wiggle/lib/resolver");
const { SHOP } = require("../../../util/constants");
const { RichEmbed } = require("discord.js");
const ImageHandling = require("../../../image/ImageHandling");
module.exports = {
    run: async (context) => { // eslint-disable-line complexity
        const { GuildSetting, GuildMember } = context.message;
        const { shop } = GuildSetting;
        const currency = GuildSetting.money.name;
        console.log(context.args);
        const successEmbed = new RichEmbed()
            .setTimestamp()
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
                                    await db.editGuildSetting(GuildSetting.guildID, GuildSetting);
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
                                    await db.editGuildSetting(GuildSetting.guildID, GuildSetting, true);
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
                            let options = "";
                            const optionsKeys = Object.keys(item);
                            for (let i = 0, n = optionsKeys.length; i < n; i++) {
                                const optionKey = optionsKeys[i];
                                const optionValue = context.flags[optionKey];
                                options += `${optionKey} : ${optionValue}\n`;
                            }
                            successEmbed.setDescription(context.t("shop.category.success.edit", {
                                category: resolvedCategory.category.name,
                                options
                            }));
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
                                    let options = "";
                                    const optionsKeys = Object.keys(item);
                                    for (let i = 0, n = optionsKeys.length; i < n; i++) {
                                        const optionKey = optionsKeys[i];
                                        const optionValue = context.flags[optionKey];
                                        options += `${optionKey} : ${optionValue}\n`;
                                    }
                                    successEmbed.setDescription(context.t("shop.item.success.edit.role", {
                                        role: role.name,
                                        category: resolvedCategory.category.name,
                                        options
                                    }));
                                    break;
                                }
                            }
                            context.channel.send(successEmbed);
                            await db.editGuildSetting(GuildSetting.guildID, GuildSetting, true);
                            break;
                        }
                    }
                    break;
                }
                case "remove": {
                    switch (context.args[1]) {
                        case "category": {
                            const type = context.args[2];
                            errorCategory = context.args[3];
                            shop.deleteCategory(errorCategory);
                            successEmbed.setDescription(context.t("shop.category.success.remove", {
                                type,
                                category: errorCategory
                            }));
                            context.channel.send(successEmbed);
                            await db.editGuildSetting(GuildSetting.guildID, GuildSetting, true);
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
                                    shop.addItem(resolvedCategory.category.name, { id: role.id, hex: role.hexColor, errorPrice });
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
                            await db.editGuildSetting(GuildSetting.guildID, GuildSetting, true);
                            break;
                        }
                    }
                    break;
                }
                case undefined: {
                    successEmbed.setDescription(context.t("money.balance", { user: context.message.author.toString(), amount: GuildMember.money.amount, currency }));
                    for (let i = 0, n = shop.shopArray.length; i < n; i++) {
                        const _shop = shop.shopArray[i];
                        const fieldTitle = _shop.options.header ? _shop.options.header : _shop.name;
                        let fieldDesc = "";
                        if (_shop.options.desc) fieldDesc += `${_shop.options.desc}\n`;
                        fieldDesc += context.t("shop.list.desc", { name: _shop.name, type: _shop.type });
                        successEmbed.addField(fieldTitle, fieldDesc);
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
                            if (resolvedCategory.category.url.length === 0) {
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
                            } else {
                                await send(context, resolvedCategory, successEmbed, resolvedCategory.category.url);
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
                        value: GuildMember.money.amount,
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
    flags: [
        // header
        // name

        // price
    ],
    argTree: {
        type: "text",
        last: true,
        next: {
            // to access to a shop
            VALUE: {
                type: "text",
                last: true
            },
            add: {
                type: "text",
                next: {
                    category: {
                        type: "text",
                        next: {
                            role: {
                                type: "text",
                                next: {
                                    VALUE: {
                                        // add category role <category name>
                                        type: "text",
                                        last: true
                                    }
                                }
                            }
                        }
                    },
                    item: {
                        type: "text",
                        next: {
                            VALUE: {
                                type: "text",
                                label: "category name",
                                VALUE: {
                                    type: "int",
                                    min: 0,
                                    label: "price",
                                    next: {
                                        VALUE: {
                                            type: "text",
                                            label: "item",
                                            last: true
                                            // add item <category name> <price> <item name>
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            edit: {
                type: "text",
                next: {
                    category: {
                        type: "text",
                        next: {
                            VALUE: {
                                type: "text",
                                label: "category name",
                                last: true
                                // edit category <category> <flag options...>
                            }
                        }
                    },
                    item: {
                        type: "text",
                        next: {
                            VALUE: {
                                type: "text",
                                label: "category name",
                                next: {
                                    VALUE: {
                                        type: "text",
                                        label: "item name",
                                        last: true
                                        // edit item <category> <item> <flag options...>
                                    }
                                }
                            }
                        }
                    }
                }
            },
            remove: {
                // delete item <category> <item>
                // delete category <category>
                type: "text",
                next: {
                    category: {
                        type: "text",
                        next: {
                            VALUE: {
                                type: "text",
                                label: "category",
                                last: true
                            }
                        }
                    },
                    item: {
                        type: "text",
                        next: {
                            VALUE: {
                                type: "text",
                                label: "category",
                                next: {
                                    VALUE: {
                                        type: "text",
                                        label: "item",
                                        last: true
                                    }
                                }
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
            await db.editGuildSetting(context.message.GuildSetting.guildID, context.message.GuildSetting);
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