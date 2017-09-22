const perms = require('../util/perm');
const config = require('../config/config');
const db = require('../util/rethinkdb');
const money = require('../util/money');
const Discord = require('discord.js');

const bitField = {
    help: 1 << 0,
    base: 1 << 1
};

module.exports = {
    help: 'Feel the commies inside you',
    func: async (client, msg, args, guildMember) => {
        try{await perms.check(guildMember, msg.channel.id, "buy.base")}catch(e) {return msg.channel.send(e.message)}
        if(!args[0]) {
            return msg.channel.send("Please use this command like the following:\n`$buy <category> <item>`")
        } else {
            let array = [];
            let list = await db.getShopsCategory(msg.guild.id);
            list.forEach(function(item) {
                array.push(item);
            });
            let name = args.slice(1, args.length).join(" ");
            if(includesObject(args[0], array)) {
                if(!name) return msg.channel.send("Please enter a valid role name");
                let role = msg.guild.roles.find("name", name);
                let item = await db.getShops(msg.guild.id, args[0], role.id);
                let amount = await money.getAmount(msg.author.id, msg.guild.id);
                let moneyName = await money.getName(msg.guild.id);
                if(amount < item.price) return msg.channel.send(`You don't have enough ${moneyName} to do that.`);
                if(!item) {
                    return msg.channel.send("This item does not exist.");
                } else {
                    let category = await db.getShopsCategory(msg.guild.id, args[0]).catch(console.error);
                    switch(category.type) {
                        case "role":
                            if(msg.guild.members.get(msg.author.id).roles.get(item.id)) {
                                return msg.channel.send("You already have that role.");
                            }
                            if(msg.guild.members.get(client.user.id).hasPermission('MANAGE_ROLES')) {
                                await db.changeMoney(msg.guild.id, msg.author.id, -item.price);
                                msg.guild.members.get(msg.author.id).addRole(item.id).catch(console.error);
                                let embed = new Discord.RichEmbed()
                                    .setDescription(msg.author.toString() + " ,you bought the color " + msg.guild.roles.get(item.id).name + " for " + item.price + " " + await money.getName(msg.guild.id))
                                    .setColor("GOLD")
                                    .setFooter('asked by ' + msg.author.tag)
                                    .setTimestamp();
                                msg.channel.send({embed});
                            } else {
                                return msg.channel.send("I don't have the permission to do that D:")
                            }
                    }
                }
            } else {
                return msg.channel.send("This category does not exist.");
            }

        }
    }
};

function includesObject (search, array) {
    for(let item of array) {
        if(item.category === search) return true;
    }
    return false;
}
module.exports.bitField = bitField;
