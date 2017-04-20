const config = require('../config/config');
const perms = require('../config/perms');
module.exports = {
    help: 'Delete messages',
    func: (client, msg, args, role) => {

        if(perms.check("purge.base", role) !== true) {
            msg.channel.sendMessage("You don't have the permission to do that");
            return;
        }



        if (msg.channel.type === 'dm') {
            msg.channel.sendMessage("You can't do that in a DM, dummy!");
            return;
        }
        if (!args.length){
            msg.channel.sendMessage("Please define an ammount of messages for me to delete!");
            return;
        }
        let bot_permissions = msg.channel.permissionsFor(client.user);
        let user_permissions = msg.channel.permissionsFor(msg.author);
        if (!user_permissions.hasPermission("MANAGE_MESSAGES") || perms.check("purge.bypass", role) !== true) {
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
        if (args[0] === "user" && args[2] < config.purge.safe && perms.check("purge.user.base", role) === true) { //args[0] = user; args[1] = <user>; args[2] = <number>; args[3] = "--force"

            let messagecount = parseInt(args[2]);
            msg.channel.fetchMessages({
                limit: config.purge.max
            })
                .then(messages => {
                    let msg_array = messages.array();
                    // filter the message to only your own
                    msg_array = msg_array.filter(m => m.author.id === msg.mentions.users.first().id);
                    // limit to the requested number + 1 for the command message
                    msg_array.length = messagecount + 1;
                    // Has to delete messages individually. Cannot use `deleteMessages()` on selfbots.
                    //msg_array.map(m => m.delete().catch(console.error));
                    msg.channel.bulkDelete(msg_array);

                });
            return;
        }
        else if(args[0] === "user" && args[2] < config.purge.safe && perms.check("purge.user.base", role) !== true) {
            msg.channel.sendMessage("You don't have the permission to do that");
            return;
        }
        if (args[0] === "user" && args[2] > config.purge.safe && args[3] !== "--force") {
            msg.channel.sendMessage("I can't delete that much messages of that user in safe-mode, add `--force` to your message to force me to delete.");
            return;
        }
        if (args[0] === "user" && args[2] < config.purge.max && args[3] === "--force" && perms.check("purge.user.force", role) === true) { //args[0] = user; args[1] = <user>; args[2] = <number>; args[3] = "--force"

            let messagecount = parseInt(args[2]);
            msg.channel.fetchMessages({
                limit: config.purge.max,
            })
                .then(messages => {
                    let msg_array = messages.array();
                    // filter the message to only your own
                    msg_array = msg_array.filter(m => m.author.id === msg.mentions.users.first().id);
                    // limit to the requested number + 1 for the command message
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
                    // Has to delete messages individually. Cannot use `deleteMessages()` on selfbots.
                    //msg_array.map(m => m.delete().catch(console.error));
                    msg.channel.bulkDelete(msg_array);
                })
                .catch(console.error);
            return;
        }
        else if(args[0] === "user" && args[2] < config.purge.max && args[3] === "--force" && perms.check("purge.user.force", role) !== true) {
            msg.channel.sendMessage("You don't have the permission to do that");
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
        // get the channel logs
        msg.channel.fetchMessages({
            limit: config.purge.max
        })
            .then(messages => {
                let msg_array = messages.array();
                // filter the message to only your own
                msg_array = msg_array.filter(m => m.author.id);
                // limit to the requested number + 1 for the command message
                msg_array.length = messagecount + 1;
                // Has to delete messages individually. Cannot use `deleteMessages()` on selfbots.
                //msg_array.map(m => m.delete().catch(console.error));
                msg.channel.bulkDelete(msg_array);

            });
    }
};
