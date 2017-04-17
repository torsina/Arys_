module.exports = {
    help: 'Disconect the bot',
    func: (client, msg, args) => {
        if(msg.author.id!='245614884786667520') {
            msg.channel.sendMessage('Papi <@245614884786667520> (づ⍜⍘⍜)づ, <@' + msg.author.id + '> tried to abuse me, ban him pls!');
            return;
        }

        else{
            msg.reply(' has shut me down');
            client.destroy((err) => {console.log(err);});
        }
    }
}