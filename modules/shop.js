const perms = require('../config/perm/perms');
const config = require('../config/config');
const db = require('../util/rethinkdb');
const money = require('../util/money');
const Discord = require('discord.js');

module.exports = {
    help: 'Buy all the things!',
    func: async (client, msg, args, role) => {
        let shops = await db.getShopsCategory(msg.guild.id);
        let categoryArray = [];
        shops.forEach(function (doc) {
            categoryArray.push(doc.category);
        });
        //if(config.env === "dev") return;
        switch(args[0]) {
            case "-add":
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
                        console.log(roleInput);
                        let  roleName;
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
                                        await db.addShopCategory(msg.guild.id, args[2], headerInput, typeInput);
                                    }
                                }
                                await db.addShopItem(msg.guild.id, args[2], roleName, parseInt(args[args.indexOf("--price") + 1]), "role").catch(console.error);
                                return msg.channel.send("added the role " + roleName);
                            }
                            return msg.channel.send("Please put a valid price here.");
                        }
                        return msg.channel.send("Please put a valid role name here.");
                        break;
                    default:
                        return msg.channel.send("Synthax:\n" +
                            "-add [--role] <category> <role name> <price>");
                        break;
                }
                break;
            case undefined:
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
            console.log(items.length);
            //for(let i=0;i<items.length;i+=config.money.shop.max) {
                let stream = await money.shop(msg.guild.id, args[0], msg, 0);
                let buffers = [];
                let end;
                stream.on('data', function (chunk) {
                    buffers.push(chunk);
                });
                stream.on('end', function () {
                    end = Buffer.concat(buffers);
                    msg.channel.send({ files: [ { attachment: end, name: "name.png" } ] });
                });
            //}

        }

    }
};

