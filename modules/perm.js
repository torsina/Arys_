const perms = require('../config/perm/perms');
const roles = require('../config/perm/roles').JSON.rolePerm;
const objectPath = require('object-path');
const fs = require('fs');

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
                input = args[1] + "." + args[3];
                msg.channel.sendMessage("pre :" + perms.check(args[3], args[1]));
                objectPath.set(roles, input, bool);
                msg.channel.sendMessage("post :" + perms.check(args[3], args[1]));
                fs.writeFileSync("./config/perm/perms.json", JSON.stringify(roles), "utf8");
            }
        }
    }
};
