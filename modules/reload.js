const Arys = require('../Arys');
const wait = Arys.wait;
const perms = require('../config/perm/perms');
module.exports = {
    help: 'Reload the commands',
    func: (client, msg, args, role) => {
        if(perms.check("mod.reload.base", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `mod.reload.base`");
            return;
        }
        console.time('reload');
        msg.delete();

        if (args.length > 0 && perms.check("reload.command", role, msg.author.id) === true){
            client.load(args[0]);
            msg.channel.sendMessage('Command '+ args[0] + ' reloaded').then(m => {
                setTimeout(function() {
                    m.delete();
                }, wait);
            });
            console.timeEnd('reload');
        }
        else {
            if(perms.check("mod.reload.command", role, msg.author.id) !== true) {
                msg.channel.sendMessage("You don't have the permission `mod.reload.base`");
                return;
            }
            client.load();
            msg.channel.sendMessage('Commands reloaded.').then(m => {
                setTimeout(function() {
                    m.delete();
                }, wait);
            });
            console.timeEnd('reload');
        }
    }
};