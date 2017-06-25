const perms = require('../config/perm/perms');
const config = require('../config/config');
const db = require('../util/rethinkdb');
module.exports = {
    help: 'Custom all the things!',
    func: async (client, msg, args, role, guild) => {//TODO make perm for that command
        let id = guild.id;
        //if(config.env === "dev") return;
        switch(args[0]) {
            case "-prefix":
                switch(args[1]) {
                    case "--reset":
                        await db.deletePrefix(id);
                        msg.channel.send("Your customized prefix has been removed.");
                        break;
                    case "--set":
                        await await db.setPrefix(id, args[2]).catch(console.error);
                        msg.channel.send("My prefix for this server is now `"+ args[2] +"`.");
                        break;
                    default:
                        msg.channel.send(await db.getPrefixes()); //TODO make embed for that
                        break;
                }
        }
    }
};
