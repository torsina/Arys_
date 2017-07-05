const perms = require('../config/perm/perms');
const config = require('../config/config');
const db = require('../util/rethinkdb');
module.exports = {
    help: 'gives the list of all the current reposters',
    func: async (client, msg, args, role) => {
        if(config.env === "dev") return;
        if(perms.check("mod.reposter.base", role, msg.author.id) !== true) {
            msg.channel.send("You don't have the permission `mod.reposter.base`");
            return;
        }
        if(args.length < 1) {
            msg.channel.send("Usage : $reposter (get | set <--for dev use, reset the timers of all the current reposters)");
        }
        if(args[0] === "get") {
            if(perms.check("mod.reposter.get", role, msg.author.id) !== true) {
                msg.channel.send("You don't have the permission `mod.reposter.get`");
                return;
            }
            if(args[1] === "all") msg.channel.send(applyDate(msg, client, await db.getListenedRole(msg.guild.id)));
            else msg.channel.send(applyDate(msg, client, await db.getListenedRole(msg.guild.id, config.reposter, msg.author.id)));
        }
        if(args[0] === "set") {
            if(perms.check("mod.reposter.set", role, msg.author.id) !== true) {
                msg.channel.send("You don't have the permission `mod.reposter.set`");
                return;
            }
            msg.guild.members.filter(m=> m.roles.has(config.reposter));
            msg.guild.roles.get(config.reposter).members.forEach(function (m) {
                db.createListenedRole(msg.guild.id, config.reposter, m.id).catch(console.error);
             });
        }
        if (args[0] === "clear") {
            if(perms.check("mod.reposter.clear", role, msg.author.id) !== true) {
                msg.channel.send("You don't have the permission `mod.reposter.clear`");
                return;
            }
            db.deleteReposter();
            msg.channel.send("currently down");
        }

    }
};

function date (obj) {
    return obj.getDate() + "/"
        + parseInt(obj.getMonth()+1) + "/"
        + obj.getFullYear() + " "
        + obj.getHours() + ":"
        + obj.getMinutes() + ":"
        + obj.getSeconds();
}

function applyDate (msg, client, member) {
    let object = [];
    for (let i = 0; i<member.length; i++) {
        let enter = new Date(member[i].enter);
        if(member[i].exit === undefined) {
            object[i] = msg.guild.roles.get(member[i].role).name
                + " " + client.users.get(member[i].member).tag + " "
                + date(enter);
        }
        else {
            let exit = new Date(member[i].exit);
            object[i] = msg.guild.roles.get(member[i].role).name
                + " " + client.users.get(member[i].member).tag + " "
                + date(enter) + " "
                + date(exit);
        }
    }
    return object;
}