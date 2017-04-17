const config = require('../config/config');
module.exports = {
    help: 'Delete messages',
    func: (client, msg, args) => {
        if(msg.author.id!=config.discord.owner) {
            msg.channel.sendMessage('Papi <@'+ config.discord.owner +'> (づ⍜⍘⍜)づ, <@' + msg.author.id + '> tried to abuse me, ban him pls!');
            return;
        }


        var user_permissions = msg.channel.permissionsFor(client.user);
        if (msg.channel.server) {
            msg.channel.sendMessage("You can't do that in a DM, dummy!");
            return;
        }
        if (args[0] == ''){
            msg.channel.sendMessage("Please define an ammount of messages for me to delete!");
            return;
        }
        if (!user_permissions.hasPermission("MANAGE_MESSAGES")) {
            msg.channel.sendMessage("Sorry, your permissions doesn't allow that.");
            return;
        }
        if (!user_permissions.hasPermission("MANAGE_MESSAGES")) {
            msg.channel.sendMessage("I don't have permission to do that!");
            return;
        }
        if (args[0] > 20 && args[1] != "force"){
            msg.channel.sendMessage("I can't delete that much messages in safe-mode, add `force` to your message to force me to delete.");
            return;
        }
        if (args[0] > 100){
            msg.channel.sendMessage("The maximum is 100, 20 without `force`.");
            return;
        }
        if (args[0] == "force"){
            msg.channel.sendMessage("Please put `force` at the end of your message.");
            return;
        }

            let messagecount = parseInt(args[0]);
            // get the channel logs
            msg.channel.fetchMessages({
                limit: 100
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


}


/*
        channel.fetchMessages({limit: 10})
            .then(messages => console.log(`Received ${messages.size} messages`))
            .catch(console.error);
        msg.fetchMessages(msg.channel, args[0], function(error, messages){
                if (error){
                    msg.channel.sendMessage("Something went wrong while fetching logs.");
                    return;
                } else {
                    Logger.info("Beginning purge...");
                    var todo = messages.length,
                        delcount = 0;
                    for (msg of messages){
                        bot.deleteMessage(msg);
                        todo--;
                        delcount++;
                        if (todo === 0){
                            bot.sendMessage("Done! Deleted " + delcount + " messages.");
                            Logger.info("Ending purge, deleted " + delcount + " messages.");
                            return;
                        }}
                }
            }

        )

    }*/     //msg, suffix, bot
            //client, msg, args
 /*   function (client, msg, args) {
        var guildPerms = msg.author.permissionsFor(msg.guild)
        var botPerms = client.User.permissionsFor(msg.guild)

        if (!guildPerms.Text.MANAGE_MESSAGES) {
            msg.reply('You do not have the permission to manage messages!')
        } else if (!botPerms.Text.MANAGE_MESSAGES) {
            msg.reply('I do not have `Manage Messages` permission!')
        } else {
            if (!args || isNaN(args) || args > 100 || args < 0) {
                msg.reply('Please try again with a number between **0** to **100**.')
            } else {
                msg.channel.fetchMessages(args).then((result) => {
                    var cantDelete = 0
                    var x = 0
                    var deleteMe = []
                    for (x = 0; x < result.messages.length; x++) {
                        var compareNums = (new Date(msg.timestamp) - new Date(result.messages[x].timestamp))
                        if (compareNums > 1209600000) {
                            cantDelete++
                        } else {
                            deleteMe.push(result.messages[x])
                        }
                    }
                    msg.channel.sendMessage(`${deleteMe.length} message(s) have been purged. ${cantDelete} were omitted due to them being over two weeks old.`)
                    client.Messages.deleteMessages(deleteMe)
                }).catch((error) => {
                    msg.channel.sendMessage('I could not fetch messages to delete, try again later.')
                    Logger.error(error)
                })
            }
        }
    }

}*/