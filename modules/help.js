const fs = require('fs');
const path = require('path');
const perms = require('../config/perm/perms');
module.exports = {
    help: 'Plz send help!!',
    func: (Client, msg, args, role) => {
        if(perms.check("help.base", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `help.base`");
            return;
        }

        if (args[0] in Client.commands && Client.commands[args[0]].help)
            msg.channel.sendCode('asciidoc', `${args[0]} :: ${Client.commands[args[0]].help}`);
        else {
            let help = "";
            for (let command in Client.commands) {
                help += `${command} :: ${Client.commands[command].help}\n`
            }
            msg.channel.sendCode('asciidoc', help);
        }
    }
};