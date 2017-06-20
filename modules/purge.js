const config = require('../config/config');
const perms = require('../config/perm/perms');
module.exports = {
    help: 'Delete messages \nSynthax: $purge <number> [--force(if number>25)]\n$purge user <user> <number> [--force(if number>25)]',
    func: (client, msg, args, role) => {
        if(config.env === "dev") return;
        if(perms.check("mod.purge.base", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `mod.purge.base`");
            return;
        }
        if (msg.channel.type === 'dm') {
            msg.channel.sendMessage("You can't do that in a DM, dummy!");
            return;
        }
        if (!args.length || args[0] === "user" && args[1] === undefined){
            msg.channel.sendMessage("Please define an ammount of messages for me to delete!");
            return;
        }
        let bot_permissions = msg.channel.permissionsFor(client.user);
        let user_permissions = msg.channel.permissionsFor(msg.author);
        if (!user_permissions.hasPermission("MANAGE_MESSAGES") && perms.check("mod.purge.bypass", role, msg.author.id) !== true) {
            msg.channel.sendMessage("Sorry, your permissions doesn't allow that.");
            return;
        }
        if (!bot_permissions.hasPermission("MANAGE_MESSAGES")) {
            msg.channel.sendMessage("I don't have permission to do that!");
            return;
        }
        if (args[0] > config.purge.max){
            msg.channel.sendMessage("The maximum is " + config.purge.max + ", " + config.purge.safe + " without `--force`.");
            return;
        }
        if (args[0] === "user" && args[2] < config.purge.safe && perms.check("mod.purge.user.base", role, msg.author.id) === true) { //args[0] = user; args[1] = <user>; args[2] = <number>; args[3] = "--force"

            let messagecount = parseInt(args[2]);
            msg.channel.fetchMessages({
                limit: config.purge.max
            })
                .then(messages => {
                    let msg_array = messages.array();
                    msg_array = msg_array.filter(m => m.author.id === msg.mentions.users.first().id);
                    if(msg_array.length < messagecount + 1) {
                        msg.channel.sendMessage("that user only have " + msg_array.length +1 + " messages in this channel");
                        return;
                    }
                    msg_array.length = messagecount + 1;
                    msg.channel.bulkDelete(msg_array);
                });
            return;
        }
        else if(args[0] === "user" && args[2] < config.purge.safe && perms.check("mod.purge.user.base", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `mod.purge.user.base`");
            return;
        }
        if (args[0] === "user" && args[2] > config.purge.safe && args[3] !== "--force") {
            msg.channel.sendMessage("I can't delete that much messages of that user in safe-mode, add `--force` to your message to force me to delete.");
            return;
        }
        if (args[0] === "user" && args[2] < config.purge.max && args[3] === "--force" && perms.check("mod.purge.user.force", role, msg.author.id) === true) { //args[0] = user; args[1] = <user>; args[2] = <number>; args[3] = "--force"

            msg.channel.fetchMessages({
                limit: 100,
            })
                .then(messages => {
                    let msg_array = messages.array();
                    msg_array = msg_array.filter(m => m.author.id === msg.mentions.users.first().id);
                    if(msg_array.length < messagecount + 1) {
                        msg.channel.sendMessage("that user only have " + msg_array.length +1 + " messages in this channel");
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
        else if(args[0] === "user" && args[2] < config.purge.max && args[3] === "--force" && perms.check("mod.purge.user.force", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `mod.purge.user.force`");
            return;
        }
        if (args[0] > config.purge.safe && args[1] !== "--force"){
            msg.channel.sendMessage("I can't delete that much messages in safe-mode, add `--force` to your message to force me to delete.");
            return;
        }
        if (args[0] === "--force"){
            msg.channel.sendMessage("Please put `--force` at the end of your message.");
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
