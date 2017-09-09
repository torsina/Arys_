const perms = require('../util/perm');
const config = require('../config/config');
const db = require('../util/rethinkdb');
const money = require('../util/money');
const Discord = require('discord.js');

const bitField = {
    help: 1 << 0,
    base: 1 << 1,
    add: 1 << 2
};

module.exports = {
    help: 'Buy all the things!',
    func: async (client, msg, args, guildMember) => {
        let shops = await db.getShopsCategory(msg.guild.id);
        let categoryArray = [];
        shops.forEach(function (doc) {
            categoryArray.push(doc.category);
        });
        //if(config.env === "dev") return;
        switch(args[0]) {
            case "-add":
                try{await perms.check(guildMember, msg.channel.id, "shop.add")}catch(e) {return msg.channel.send(e.message)}
                switch(args[1]) {
                    case "--role": //0 = -add ; 1 = --role; 2 = category; 3 = role; 4 = --price; 5 = price
                        let roleInput = "";
                        if(args.indexOf("--price") !== -1) {
                            let max = args.indexOf("--price");
                            let min = args.indexOf("--role") + 2;
                            for(let i = min;i<max;i++) {
                                if(i === max-1) {
                                    roleInput += args[i]
                                } else {
                                    roleInput += args[i] + " "
                                }
                            }
                        }
                        let roleName;
                        for(let item of msg.guild.roles.values()) {
                            if(item.name.match(roleInput)) {
                                roleName = item.name;
                                break;
                            }
                        }
                        if(roleName) {
                            if(!isNaN(parseInt(args[args.indexOf("--price") + 1]))) {
                                let _category = await db.getShopsCategory(msg.guild.id, args[2]);
                                if(!_category) {
                                    let str = "";
                                    config.money.shop.type.forEach(function (doc) {
                                        str += "`" + doc + "`\n";
                                    });
                                    msg.channel.send("Please enter the display name of the category and the type of the category\n" +
                                        "To do that, please use:\n" +
                                        "`--header <header> --type <type>`\n" +
                                        "avalaible types: " + str);
                                    let filter = m => m.author.id === msg.author.id;
                                    let doc = await msg.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
                                        .catch(collected => msg.channel.send(`Sorry, you took too much time to create the new category`));
                                    doc = doc.first().content.split(' ');
                                    if(doc.indexOf("--header") === -1 && doc.indexOf("--type") === -1) {
                                        return msg.channel.send("Please use both `--header` and `--type` in your answer.\nCommand canceled.")
                                    } else {
                                        let headerInput = "";
                                        let typeInput = "";
                                        let min = doc.indexOf("--header");
                                        let max = doc.indexOf("--type");
                                        for(let i = min+1;i<max;i++) {
                                            if(i === max-1) {
                                                headerInput += doc[i]
                                            } else {
                                                headerInput += doc[i] + " "
                                            }
                                        }
                                        for(let i = max+1;i<doc.length;i++) {
                                            if(i === doc.length-1) {
                                                typeInput += doc[i]
                                            } else {
                                                typeInput += doc[i] + " "
                                            }
                                        }
                                        await db.addShopCategory(msg.guild.id, args[2], headerInput, typeInput).catch(console.error);
                                    }
                                }
                                try{
                                    await db.addShopItem(msg.guild.id, args[2], msg.guild.roles.find("name", roleName).id, parseInt(args[args.indexOf("--price") + 1]));
                                }
                                catch(e) {
                                    return msg.channel.send(e.message);
                                }
                                return msg.channel.send("added the role " + roleName);
                            }
                            return msg.channel.send("Please put a valid price here.");
                        }
                        return msg.channel.send("Please put a valid role name here.");
                        break;
                    default:
                        return msg.channel.send("Synthax:\n" +
                            "`-add [--role] <category> <role name> <price>`");
                        break;
                }
                break;
            case "-remove": {
                switch(args[1]) {
                    case "--role": {
                        let name = args.slice();
                        name.splice(0, 3);
                        name = name.join(" ");
                        console.log(name);
                        let role = msg.guild.roles.find("name", name);
                        if(!role) return msg.channel.send("No such role found\n:warning: case sensitive.");
                        try {
                            await db.deleteShopItem(msg.guild.id, args[2], role.id);
                        }
                        catch(e) {
                            return msg.channel.send(e.message)
                        }
                        return msg.channel.send("The role " + name + " was deleted from the shop " + args[2]);
                    }
                    case undefined: {
                        return msg.channel.send("Synthax:\n" +
                            "`-remove [--role] <category> <role name>`");
                    }
                }
                break;
            }
            case undefined:
                try{await perms.check(guildMember, msg.channel.id, "shop.base")}catch(e) {return msg.channel.send(e.message)}
                let embed = new Discord.RichEmbed()
                    .setFooter('asked by ' + msg.author.tag)
                    .setTimestamp()
                    .setDescription(msg.author.toString() + "'s balance: " + await money.getAmount(msg.author.id, msg.guild.id) + " " + await money.getName(msg.guild.id));

                for(let shop of shops) {
                    embed.addField(shop.header, "Use `$shop " + shop.category + "` to see the available " + shop.category + " " + shop.type + "s");
                }
                msg.channel.send({embed});
                break;
        }
        if(categoryArray.includes(args[0])) {
            let items = await db.getShops(msg.guild.id, args[0]);
            let obj = [];
            for(let i=0;i<items.length;i+=18) {
                obj[i] = {};
                console.log(i);
                obj[i].buffer = await money.shop(msg.guild.id, args[0], msg, i);
                msg.channel.send({ files: [ { attachment: obj[i].buffer, name: "name.png" } ] });
            }

        }

    }
};
module.exports.bitField = bitField;