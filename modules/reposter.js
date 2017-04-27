const perms = require('../config/perm/perms');
const db = require('../Arys').db;
const config = require('../config/config');
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
            db.serialize( function() {
                let output = "";
                db.all("SELECT * FROM reposter", function(err, user) {
                    user.forEach(function (reposter) {
                        output +=  "<@" + reposter.id + ">: " + reposter.beginning + "   " + reposter.end + "\n";

                    });
                    msg.channel.sendMessage(output);

                });
            });

        }
        if(args[0] === "set") {
            if(perms.check("mod.reposter.set", role, msg.author.id) !== true) {
                msg.channel.sendMessage("You don't have the permission `mod.reposter.set`");
                return;
            }
            msg.guild.members.filter(m=> m.roles.has(config.reposter));
            msg.guild.roles.get(config.reposter).members.forEach(function (m) {
             let date = timestamp.getFullYear() + '-' + (timestamp.getMonth() + 1) + '-' + timestamp.getDate() + ' ' + timestamp.getHours() + ':' + timestamp.getMinutes();
             let prep = db.prepare("INSERT INTO reposter VALUES (?,?,?)");
             prep.run(m.id, date, "");
             })

        }

    }
};