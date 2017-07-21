const fs = require('fs');
const perms = require('../util/perm');

const bitField = {
    help: 1 << 0,
    base: 1 << 1
};

module.exports = {
    help: 'Plz send help!!',
    func: async(Client, msg, args, guildMember) => {
        try{await perms.check(guildMember, msg.channel.id, "help.base")}catch(e) {return msg.channel.send(e.message)}
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
module.exports.bitField = bitField;