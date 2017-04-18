const post = require('./post');
const config = require('../config/config');

module.exports = {
    help: 'Ping, Pong',
    func: (client, msg, args) => {
       msg.channel.sendMessage('pong ' + msg.guild.id);


    }
};
