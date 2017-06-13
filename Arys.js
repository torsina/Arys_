const Discord = require('discord.js');
const fs = require('fs');
const Client = new Discord.Client();
const config = require('./config/config');
const roles = require('./config/perm/roles');
const db = require('./util/db');
const web = require('./web/server');
Client.login(config.discord.token.bot).catch(console.error);
Client.once('ready', () => {
    console.time('loading');
    Client.load();
    roles.load();
    db.load();
    Client.user.setGame('type $help');
    console.timeEnd('loading');
    console.log('I am ready!');
});



Client.load = (command) => {
    let commandsList = fs.readdirSync('./modules/');
    if (command) {
        if (commandsList.indexOf(`${command}.js`) >= 0) {
            delete require.cache[require.resolve(`./modules/${command}`)];
            Client.commands[command] = require(`./modules/${command}`);
        }
    } else {
        Client.commands = {};
        for (i = 0; i < commandsList.length; i++) {
            let item = commandsList[i];
            if (item.match(/\.js$/)) {
                delete require.cache[require.resolve(`./modules/${item}`)];
                Client.commands[item.slice(0, -3)] = require(`./modules/${item}`);
                console.log('loaded :' +item);
            }
        }
    }
};

Client.on('guildMemberUpdate', (oldMember, newMember) => {
    if (!oldMember.roles.has(config.reposter) && newMember.roles.has(config.reposter)) {
        db.createReposter(oldMember.id);
    }
    if(oldMember.roles.has(config.reposter) && !newMember.roles.has(config.reposter)) {
        db.endReposter(oldMember.id);
    }
});

Client.on('message', message => {
    //invite delete system
    if(message.content.includes("discord.gg" || "https://discord.gg/" || "www.discord.gg/" || "https://discord.gg" || "https:/ /discord.gg" || "www" && "discord" && "gg" || "https" && "discord" && "gg")) {
        Client.fetchInvite(message.content.split("gg/")[1].split(" ")[0]).then(m => {
            if(m.guild.id === "242655328410402816") {
                message.channel.sendMessage("from 9i");
            } else {
                message.channel.sendMessage("from other");
            }
        });
    }
    //interaction
    if(message.content.startsWith("<@" + Client.user.id + ">, what should we do of her ?")) {
        message.channel.sendMessage("throw her in a pit and let me do the rest")
    }
    if(message.content.startsWith("<@" + Client.user.id + ">, what should we do of him ?")) {
        message.channel.sendMessage("throw him in a pit and let me do the rest")
    }
    //emoji delete system
    if (isEmoji(message.content) === true) {
            console.log("there is an emoji here");
    }
    //server emoji analytics
    if(!message.author.bot && config.env !== "dev") {
        let serverEmojis = message.guild.emojis.array();
        let emojiStack = message.content.match(/<:(\w+):(\d+)>/g);
        if (emojiStack !== null) {
            for (let i = 0; i<serverEmojis.length; i++) {
                let emoji = "<:" + serverEmojis[i].name + ":" + serverEmojis[i].id + ">";
                if (emojiStack.includes(emoji)) {
                    db.createAnalytic(emoji, message.author.id, message.channel.id, message.guild.id).catch(console.error);
                    console.log(emoji);
                }
            }
        }
    }
    //command handler
        if (message.content.startsWith(config.discord.prefix)) {
            if(message.channel.id==="257541472772030464") return;
            if (message.author.bot) return;
            let member = message.guild.member(Client.users.get(message.author.id));
            let role = check(member);
            let guild = message.guild;

            let command = args[0].slice(config.discord.prefix.length);
            args.splice(0, 1);

            if (command in Client.commands) {
                let timestamp = new Date();
                console.log('[' + timestamp.getFullYear() + '-' + (timestamp.getMonth() + 1) + '-' + timestamp.getDate() + ' ' + timestamp.getHours() + ':' + timestamp.getMinutes() + '] [' + message.author.username + '#' + message.author.discriminator + '] [' + message.author.id + '] ' + command);
                Client.commands[command].func(Client, message, args, role, guild);
                console.log(args);
            }
        }
});

function check(member){
    if(member.id === config.discord.owner) {
        return "bot_owner";
    }
    if(member.roles.has(roles.id.admin)) {
        return "admin";
    }
    else if(member.roles.has(roles.id.smurf)) {
        return "smurf";
    }
    else if(member.roles.has(roles.id.eye)) {
        return "eye";
    }
    else if(member.roles.has(roles.id.nsfw_god)) {
        return "nsfw_god";
    }
    else if(member.roles.has(roles.id.hot)) {
        return "hot";
    }
    else if(member.roles.has(roles.id.oldfag)) {
        return "oldfag";
    }
    else if(member.roles.has(roles.id.op)) {
        return "op";
    }
    else if(member.roles.has(roles.id.captain)) {
        return "captain";
    }
    else if(member.roles.has(roles.id.trending)) {
        return "trending";
    }
    else if(member.roles.has(roles.id.fresh)) {
        return "fresh";
    }
    else {
        return "none";
    }
}

function isEmoji(str) {
    let ranges = [
        //'\ud83c[\udf00-\udfff]', // U+1F300 to U+1F3FF
        //'\ud83d[\udc00-\ude4f]', // U+1F400 to U+1F64F
        '\ud83d[\ude00-\udeff]' // U+1F680 to U+1F6FF // U+263A // 1F600 - 1F636
    ];
    if (str.match(ranges.join('|'))) {
        return true;
    } else {
        return false;
    }
}

process.on("unhandledRejection", err => {
    console.error("Uncaught Promise Error: \n" + err.stack);
});

exports.Client = Client;
