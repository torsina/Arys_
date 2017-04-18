const Arys = require('../Arys');
const wait = Arys.wait;
const config = require('../config/config');
module.exports = {
    help: 'Reload the commands',
    func: (client, msg, args) => {
        console.time('reload');
        msg.delete();
        if(msg.author.id!==config.discord.owner) {
            msg.channel.sendMessage('Papi <@'+config.discord.owner+'> (づ⍜⍘⍜)づ, <@' + msg.author.id + '> tried to abuse me, ban him pls!');
            return;
        }

        if (args.length > 0){
            client.load(args[0]);
            msg.channel.sendMessage('Command '+ args[0] + ' reloaded').then(m => {
                setTimeout(function() {
                    m.delete();
                }, wait);
            });
            console.timeEnd('reload');
        }
        else {
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