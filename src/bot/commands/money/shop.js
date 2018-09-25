const db = require("../../util/rethink");
const { RichEmbed } = require("discord.js");
const ImageHandling = require("../../../image/ImageHandling");
module.exports = {
    run: async (context) => {
        const { args, message: { guildSetting, guildMember, constants }, message } = context;
        const { shop, guildID } = guildSetting;
        const currency = guildSetting.money.name;
        const successEmbed = new RichEmbed()
            .setTimestamp(new Date(context.message.createdTimestamp))
            .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
            .setColor("GREEN");
        try {
            switch (args[0]) {
                case "add": {
                    switch (args[1]) {
                        case "role": {
                            const action = shop.addRole(args[2], args[3]);
                            await db.editGuildSetting(guildID, guildSetting);
                            successEmbed.setDescription(context.t(`shop.${action}.role.success`, {
                                roleName: args[2].name,
                                price: args[3],
                                currency
                            }));
                            context.channel.send(successEmbed);
                        }
                    }
                    break;
                }
                case "edit": {
                    switch (args[1]) {
                        case "role": {
                            const action = shop.editRole(args[2], args[3]);
                            await db.editGuildSetting(guildID, guildSetting);
                            successEmbed.setDescription(context.t(`shop.${action}.role.success`, {
                                roleName: args[2].name,
                                price: args[3],
                                currency
                            }));
                            context.channel.send(successEmbed);
                        }
                    }
                    break;
                }
                case "delete": {
                    switch (args[1]) {
                        case "role": {
                            const action = shop.deleteRole(args[2]);
                            await db.editGuildSetting(guildID, guildSetting);
                            successEmbed.setDescription(context.t(`shop.${action}.role.success`, {
                                roleName: args[2].name
                            }));
                            context.channel.send(successEmbed);
                        }
                    }
                    break;
                }
                case "buy": {
                    switch (args[1]) {
                        case "role": {
                            if (!shop.hasRole(args[2])) throw new message.FriendlyError("shop.role.notInShop", { roleName: args[2].name });
                            if (message.member.roles.has(args[2].id)) throw new message.FriendlyError("shop.buy.alreadyHaveRole", { roleName: args[2].name });
                            const shopRole = shop.getRole(args[2]);
                            guildMember.money.editMoney(-shopRole.price);
                            message.member.addRole(args[2]);
                            await db.editGuildMember(guildMember);
                            successEmbed.setDescription(context.t(`shop.buy.role.success`, {
                                roleName: args[2].name,
                                price: shopRole.price,
                                currency
                            }));
                            context.channel.send(successEmbed);
                        }
                    }
                    break;
                }
                case "sell": {
                    switch (args[1]) {
                        case "role": {
                            if (!shop.hasRole(args[2])) throw new message.FriendlyError("shop.role.notInShop", { roleName: args[2].name });
                            if (!message.member.roles.has(args[2].id)) throw new message.FriendlyError("shop.buy.notHaveRole", { roleName: args[2].name });
                            const shopRole = shop.getRole(args[2]);
                            guildMember.money.editMoney(shopRole.price / 2);
                            await message.member.removeRole(args[2]);
                            await db.editGuildMember(guildMember);
                            successEmbed.setDescription(context.t(`shop.sell.role.success`, {
                                roleName: args[2].name,
                                price: shopRole.price,
                                currency
                            }));
                            context.channel.send(successEmbed);
                        }
                    }
                    break;
                }
                case "roles": {
                    const shopArray = shop.roles;
                    const { rolesURL } = shop;
                    const itemsPerPage = constants.SHOP.maxPerPage;
                    const pages = Math.ceil(shopArray.length / itemsPerPage);
                    if (pages === 0) {
                        throw new context.message.FriendlyError("shop.display.noRoles");
                    }
                    successEmbed.setTitle(context.t("shop.display.roleShopTitle"));
                    if (rolesURL.length !== 0) {
                        for (let i = 0, n = rolesURL.length; i < n; i++) {
                            const URL = rolesURL[i];
                            successEmbed.setDescription(context.t("words.page", { current: i + 1, total: n }));
                            successEmbed.setImage(URL);
                            context.channel.send(successEmbed);
                        }
                    } else {
                        const requests = [];
                        const promises = [];
                        for (let i = 0; i < pages; i++) {
                            const pageArray = shopArray.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
                            const pageArraySent = [];
                            for (let j = 0; j < pageArray.length; j++) {
                                const item = pageArray[j];
                                const role = message.guild.roles.get(item.id);
                                pageArraySent.push({
                                    name: role.name,
                                    hex: role.hexColor === "#000000" ? "#FFFFFF" : role.hexColor,
                                    price: item.price
                                });
                            }
                            requests[i] = {
                                type: "role",
                                items: pageArraySent
                            };
                        }
                        for (let i = 0, n = requests.length; i < n; i++) {
                            promises[i] = ImageHandling.startProcess(requests[i]);
                        }
                        Promise.all(promises).then(async (images) => {
                            for (let i = 0; i < images.length; i++) {
                                const image = images[i];
                                successEmbed.setDescription(context.t("words.page", { current: i + 1, total: images.length }));
                                // setting the property directly instead of using the method because the method doesn't replace the file
                                successEmbed.file = image;
                                const sentMessage = await context.channel.send(successEmbed);
                                sentMessage.attachments.forEach(attachment => {
                                    if (attachment.height) {
                                        rolesURL[i] = attachment.proxyURL;
                                    }
                                });
                                await db.editGuildSetting(guildID, guildSetting);
                            }
                        });
                    }
                    break;
                }
                default: {
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
                        user: context.author.toString()
                    }
                };
                if (err.data) Object.assign(error.data, err.data);
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
        const { length } = args;
        const { ResolverError, FriendlyError } = message;
        try {
            switch (args[0]) {
                case "add": {
                    switch (args[1]) {
                        case "role": {
                            try {
                                if (args.length < 4) throw new FriendlyError;
                                args[2] = args.slice(2, length - 1).join(" ");
                                args[2] = await message.command.resolver.role(args[2], message);
                                args[3] = await message.command.resolver.int(args[length - 1], message, { min: 0, max: 999999999 });
                                return args.slice(0, 4);
                            } catch (innerError) {
                                if (innerError instanceof ResolverError) {
                                    throw new FriendlyError("arys.usageWithError", { usage: "shop.add.role.usage", error: innerError.message });
                                } else if (innerError instanceof FriendlyError) {
                                    throw new FriendlyError("shop.add.role.usage");
                                } else {
                                    throw innerError;
                                }
                            }
                        }
                        default: {
                            throw new FriendlyError("shop.add.usage");
                        }
                    }
                }
                case "edit": {
                    switch (args[1]) {
                        case "role": {
                            try {
                                if (args.length < 4) throw new FriendlyError;
                                args[2] = args.slice(2, length - 1).join(" ");
                                args[2] = await message.command.resolver.role(args[2], message);
                                args[3] = await message.command.resolver.int(args[length - 1], message, { min: 0, max: 999999999 });
                                return args.slice(0, 4);
                            } catch (innerError) {
                                if (innerError instanceof ResolverError) {
                                    throw new FriendlyError("arys.usageWithError", { usage: "shop.edit.role.usage", error: innerError.message });
                                } else if (innerError instanceof TypeError) {
                                    throw new FriendlyError("shop.edit.role.usage");
                                } else {
                                    throw innerError;
                                }
                            }
                        }
                        default: {
                            throw new FriendlyError("shop.edit.usage");
                        }
                    }
                }
                case "delete": {
                    switch (args[1]) {
                        case "role": {
                            try {
                                if (args.length < 3) throw new FriendlyError;
                                args[2] = args.slice(2, length).join(" ");
                                args[2] = await message.command.resolver.role(args[2], message);
                                return args.slice(0, 3);
                            } catch (innerError) {
                                if (innerError instanceof ResolverError) {
                                    throw new FriendlyError("arys.usageWithError", { usage: "shop.delete.role.usage", error: innerError.message });
                                } else if (innerError instanceof TypeError) {
                                    throw new FriendlyError("shop.delete.role.usage");
                                } else {
                                    throw innerError;
                                }
                            }
                        }
                        default: {
                            throw new FriendlyError("shop.delete.usage");
                        }
                    }
                }
                case "roles": {
                    return args.slice(0, 1);
                }
                case "buy": {
                    switch (args[1]) {
                        case "role": {
                            try {
                                if (args.length < 3) throw new FriendlyError;
                                args[2] = args.slice(2, length).join(" ");
                                args[2] = await message.command.resolver.role(args[2], message);
                                return args.slice(0, 3);
                            } catch (innerError) {
                                if (innerError instanceof ResolverError) {
                                    throw new FriendlyError("arys.usageWithError", { usage: "shop.buy.role.usage", error: innerError.message });
                                } else if (innerError instanceof TypeError) {
                                    throw new FriendlyError("shop.buy.role.usage");
                                } else {
                                    throw innerError;
                                }
                            }
                        }
                        default: {
                            throw new FriendlyError("shop.buy.usage");
                        }
                    }
                }
                case "sell": {
                    switch (args[1]) {
                        case "role": {
                            try {
                                if (args.length < 3) throw new FriendlyError;
                                args[2] = args.slice(2, length).join(" ");
                                args[2] = await message.command.resolver.role(args[2], message);
                                return args.slice(0, 3);
                            } catch (innerError) {
                                if (innerError instanceof ResolverError) {
                                    throw new FriendlyError("arys.usageWithError", { usage: "shop.sell.role.usage", error: innerError.message });
                                } else if (innerError instanceof TypeError) {
                                    throw new FriendlyError("shop.sell.role.usage");
                                } else {
                                    throw innerError;
                                }
                            }
                        }
                        default: {
                            throw new FriendlyError("shop.sell.usage");
                        }
                    }
                }
                default: {
                    const permission = await message.BitField.check("money.shop.edit", message, message.guildSetting);
                    if (permission.result) {
                        throw new FriendlyError("shop.usageWithEdit");
                    } else {
                        throw new FriendlyError("shop.usageWithoutEdit");
                    }
                }
            }
        } catch (err) {
            throw err;
        }
    }
};
