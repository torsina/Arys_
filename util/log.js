const log = module.exports = {};
const db = require('./rethinkdb');
let settings;

log.importSetting = (setting) => {
    settings = setting;
};

log.init = (Client) => {
    Client.on('guildMemberAdd', member => {
        if(settings.get(member.guild.id).logChannel.guildMemberAdd) {
            Client.channels.get(settings.get(member.guild.id).logChannel.guildMemberAdd[0]).send(Client.users.get(member.id).tag+ " joined the server");
        }
    });
};