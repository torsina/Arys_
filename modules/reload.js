const Arys = require('../Arys');
const wait = Arys.wait;
const perms = require('../util/perm');

const bitField = {
    help: 1 << 0,
    base: 1 << 1,
};

module.exports = {
    help: 'Reload the commands',
    func: async(client, msg, args, guildMember) => {
        try{await perms.check(guildMember, "reload.base")}catch(e) {return msg.channel.send(e.message)}
        console.time('reload');
        if (args.length > 0 && perms.check("reload.command", role, msg.author.id) === true){
            client.load(args[0]);
            msg.channel.send('Command '+ args[0] + ' reloaded').then(m => {
                setTimeout(function() {
                    m.delete();
                }, wait);
            });
            console.timeEnd('reload');
        }
        else {
            if(perms.check("mod.reload.command", role, msg.author.id) !== true) {
                msg.channel.send("You don't have the permission `mod.reload.base`");
                return;
            }
            client.load();
            msg.channel.send('Commands reloaded.').then(m => {
                setTimeout(function() {
                    m.delete();
                }, wait);
            });
            console.timeEnd('reload');
        }
    }
};
module.exports.bitField = bitField;