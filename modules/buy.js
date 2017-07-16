const perms = require('../util/perm');
const config = require('../config/config');
const db = require('../util/rethinkdb');
const money = require('../util/money');

const bitField = {
    help: 1 << 0,
    base: 1 << 1
};

module.exports = {
    help: 'Ping, Pong',
    func: async (client, msg, args, guildMember) => {
        try{await perms.check(guildMember, "buy.base")}catch(e) {return msg.channel.send(e.message)}
        if(!args[0]) {
            return msg.channel.send("Please use this command like the following:\n`$buy <category> <item>`")
        } else {
            let array = [];
            let list = await db.getShopsCategory(msg.guild.id);
            list.forEach(function(item) {
                array.push(item);
            });
            let name = "";
            for(let i = 1;i<args.length;i++) {
                if(i === args.length-1) {
                    name += args[i]
                } else {
                    name += args[i] + " "
                }
            }
            if(includesObject(args[0], array)) {
                if(!name) return msg.channel.send("Please enter a valid role name");
                let item = await db.getShops(msg.guild.id, args[0], name);
                item = item[0];
                console.log(item);
                if(!item) {
                    return msg.channel.send("This item does not exist.");
                } else {
                    let category = await db.getShopsCategory(msg.guild.id, args[0]).catch(console.error);
                    switch(category.type) {
                        case "role":
                            if(msg.guild.members.get(msg.author.id).roles.find("name", item.item)) {
                                return msg.channel.send("You already have that role.")
                            }
                            if(msg.guild.members.get(client.user.id).hasPermission('MANAGE_ROLES')) {
                                await db.changeMoney(msg.guild.id, msg.author.id, -item.price).catch(e => {msg.channel.send(e.message)});
                                msg.guild.members.get(msg.author.id).addRole(msg.guild.roles.find("name", item.item)).catch(console.error);
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
