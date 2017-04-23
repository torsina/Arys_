const perms = require('../config/perms');
const roles = require('../config/roles');
const objectPath = require('object-path');

module.exports = {
    help: 'trigger perm function',
    func: (client, msg, args, role) => {
        let bool;
        if (perms.check("mod.perm.base", role) !== true) {
            msg.channel.sendMessage("You don't have the permission `mod.perm.base`");
        } else {
            if (args[0] === "-role" && perms.check(args[3], args[1]) !== "wrong permission" && args[2] === "-perm") { // 0 = -role // 1 = role // 2 = -perm // 3 = perm // 4 = value
                //msg.channel.sendMessage("pre :"+objectPath.get(roles.rolePerm, args[3]));
                if(args[4] === "true") {
                    bool = true;
                } else if (args[4] === "false") {
                    bool = false;
                } else {
                    msg.channel.sendMessage("this is not a right value");
                }
                //objectPath.set(roles.rolePerm, args[3], bool);
                msg.channel.sendMessage("post :");
                msg.channel.sendMessage(perms.check(objectPath.get(roles.rolePerm)));
            }
        }
    }
};
