const perms = require('../config/perm/perms');
const config = require('../config/config');
const db = require('../util/db');
let reposter;
let timestamp = new Date();
module.exports = {
    help: 'gives the list of all the current reposters',
    func: (client, msg, args, role) => {
        if(perms.check("mod.reposter.base", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `mod.reposter.base`");
            return;
        }
        if(args.length < 1) {
            msg.channel.sendMessage("Usage : $reposter (get | set <--for dev use, reset the timers of all the current reposters)");
        }
        if(args[0] === "get") {
            if(perms.check("mod.reposter.get", role, msg.author.id) !== true) {
                msg.channel.sendMessage("You don't have the permission `mod.reposter.get`");
                return;
            }
            db.getReposter().then((member) => {
                let object = [];
                for (let i = 0; i<member.length; i++) {
                    object[i] = member[i].id + " " + member[i].enter + " " + member[i].exit;
                }
                msg.channel.sendMessage(object);
            }).catch(console.error);
        }
        if(args[0] === "set") {
            if(perms.check("mod.reposter.set", role, msg.author.id) !== true) {
                msg.channel.sendMessage("You don't have the permission `mod.reposter.set`");
                return;
            }
            msg.guild.members.filter(m=> m.roles.has(config.reposter));
            msg.guild.roles.get(config.reposter).members.forEach(function (m) {
                db.createReposter(m.id).catch(console.error);
             })
        }
        if (args[0] === "clear") {
            if(perms.check("mod.reposter.clear", role, msg.author.id) !== true) {
                msg.channel.sendMessage("You don't have the permission `mod.reposter.clear`");
                return;
            }
            db.deleteReposter();
            msg.channel.sendMessage("table deleted");
        }

    }
};