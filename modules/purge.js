const config = require('../config/config');
const perms = require('../util/perm');

const bitField = {
    help: 1 << 0,
    base: 1 << 1,
    user: 1 << 2,
    force: 1 << 3,
    bypass_rank: 1 << 4
};

module.exports = {
    help: 'Delete messages \nSynthax: $purge <number> [--force(if number>25)]\n$purge user <user> <number> [--force(if number>25)]',
    func: async(client, msg, args, guildMember) => {
        try{await perms.check(guildMember, msg.channel.id, "purge.base")}catch(e) {return msg.channel.send(e.message)}
        if(config.env === "dev") return;
        if (msg.channel.type === 'dm') {
            msg.channel.send("You can't do that in a DM, dummy!");
            return;
        }
        if (!args.length || args[0] === "user" && args[1] === undefined){
            msg.channel.send("Please define an ammount of messages for me to delete!");
            return;
        }
        let bot_permissions = msg.channel.permissionsFor(client.user);
        let user_permissions = msg.channel.permissionsFor(msg.author);
        if (!user_permissions.hasPermission("MANAGE_MESSAGES") && await perms.check(guildMember, msg.channel.id, "purge.bypass.rank") !== true) {
            msg.channel.send("Sorry, your permissions doesn't allow that.");
            return;
        }
        if (!bot_permissions.hasPermission("MANAGE_MESSAGES")) {
            msg.channel.send("I don't have permission to do that!");
            return;
        }
        if (args[0] > config.purge.max){
            msg.channel.send("The maximum is " + config.purge.max + ", " + config.purge.safe + " without `--force`.");
            return;
        }
        if (args[0] === "user" && args[2] < config.purge.safe && perms.check(guildMember, msg.channel.id, "purge.user") === true) { //args[0] = user; args[1] = <user>; args[2] = <number>; args[3] = "--force"

            let messagecount = parseInt(args[2]);
            msg.channel.fetchMessages({
                limit: config.purge.max
            })
                .then(messages => {
                    let msg_array = messages.array();
                    msg_array = msg_array.filter(m => m.author.id === msg.mentions.users.first().id);
                    if(msg_array.length < messagecount + 1) {
                        msg.channel.send("that user only have " + msg_array.length +1 + " messages in this channel");
                        return;
                    }
                    msg_array.length = messagecount + 1;
                    msg.channel.bulkDelete(msg_array);
                });
            return;
        }
        try{await perms.check(guildMember, msg.channel.id, "purge.user")}catch(e) {return msg.channel.send(e.message)}
        if (args[0] === "user" && args[2] > config.purge.safe && args[3] !== "--force") {
            msg.channel.send("I can't delete that much messages of that user in safe-mode, add `--force` to your message to force me to delete.");
            return;
        }
        if (args[0] === "user" && args[2] < config.purge.max && args[3] === "--force" && await perms.check(guildMember, msg.channel.id, "purge.force") === true) { //args[0] = user; args[1] = <user>; args[2] = <number>; args[3] = "--force"

            msg.channel.fetchMessages({
                limit: 100,
            })
                .then(messages => {
                    let msg_array = messages.array();
                    msg_array = msg_array.filter(m => m.author.id === msg.mentions.users.first().id);
                    if(msg_array.length < messagecount + 1) {
                        msg.channel.send("that user only have " + msg_array.length +1 + " messages in this channel");
                        return;
                    }
                    while (msg_array  < args[2]) {
                        msg.channel.fetchMessages({
                            limit: config.purge.max,
                            before: messages
                        })
                            .then(m => {
                                msg_array += m.filter(m => m.author.id === msg.mentions.users.first().id);
                            });
                        console.log("test");
                    }
                    msg.channel.bulkDelete(msg_array);
                })
                .catch(console.error);
            return;
        }
        try{await perms.check(guildMember, msg.channel.id, "purge.force")}catch(e) {return msg.channel.send(e.message)}
        if (args[0] > config.purge.safe && args[1] !== "--force"){
            msg.channel.send("I can't delete that much messages in safe-mode, add `--force` to your message to force me to delete.");
            return;
        }
        if (args[0] === "--force"){
            msg.channel.send("Please put `--force` at the end of your message.");
            return;
        }
        let messagecount = parseInt(args[0]);
        msg.channel.fetchMessages({
            limit: 100
        })
            .then(messages => {
                let msg_array = messages.array();
                msg_array = msg_array.filter(m => m.author.id);
                msg_array.length = messagecount + 1;
                msg.channel.bulkDelete(msg_array);
            });
    }
};
module.exports.bitField = bitField;
