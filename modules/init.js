const fs = require('fs');
const perms = require('../config/perm/perms')
module.exports = {
    help: 'Create the roles.json file',
    func: (client, msg, args, role) => {
        if(perms.check("init.base", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `init.base`");
        }
        else{
            fs.writeFileSync("./config/perm/JSON/perms.json", JSON.stringify(require("../config/perm/roles.js").rolePermBase), "utf8", function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
            fs.writeFileSync("./config/perm/JSON/users.json", JSON.stringify(require("../config/perm/users.js").perm), "utf8", function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
        }
    }
};