const post = require('./post');
const config = require('../config/config');

module.exports = {
    help: 'Ping, Pong',
    func: (client, msg, args) => {
       msg.channel.sendMessage('pong ' + msg.author.id);
       if(msg.author.id===config.discord.owner){
           msg.reply("ffs understand how this work")
       }
       else{
           msg.reply("please..");
       }
    }
}

/**
 * Demonstration
 * @type {string}
 */
/*exports.help = {
    help: 'Ping, Pong',
    func: (client, msg, args) => {
        msg.reply('pong');
    }
}

exports.hello = {
    help: 'Ping, Pong',
    func: (client, msg, args) => {
        msg.reply('pong');
    }
}


exports.log = {
    help: 'Disconect the bot',
    func: (client, msg, args) => {
        if(msg.author.id!=245614884786667520) {
            msg.channel.sendMessage('Mommy <@245614884786667520> (づ⍜⍘⍜)づ, ' + msg.author.toString() + ' tried to abuse me, ban him pls!');
            return;
        }

        else{
            msg.channel.sendMessage(msg.author.toString() + 'shutted me down');
            client.destroy((err) => {console.log(err);});
        }
    }
}
    */