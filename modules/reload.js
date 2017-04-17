const Arys = require('../Arys');
const wait = Arys.wait;
module.exports = {
    help: 'Reload the commands',
    func: (client, msg, args) => {
        console.time('reload');
        if(msg.author.id!='245614884786667520') {
            msg.channel.sendMessage('Papi <@245614884786667520> (づ⍜⍘⍜)づ, <@' + msg.author.id + '> tried to abuse me, ban him pls!');
            return;
        }

        if (args.length > 0){
            client.load(args[0]);
            msg.channel.sendMessage('Command '+ args[0] + ' loaded').then(m => {
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
}