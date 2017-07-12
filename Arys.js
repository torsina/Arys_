const Discord = require('discord.js');
const fs = require('fs');
const Client = new Discord.Client();
const config = require('./config/config');
const roles = require('./config/perm/roles');
const db = require('./util/rethinkdb');
const money = require('./util/money');
const log = require('./util/log');
const web = require('./web/server');
let trigger = false;
let settings;
Client.login(config.discord.token.bot).catch(console.error);
Client.once('ready', async () => {
    console.time('loading');
    Client.load();
    roles.load();
    await db.init(Client).catch(console.error).then(async () => {
        settings = await db.getSettings();
        let stream = await db.streamSetting().catch(console.error);
        stream.on('data', data => {
            settings.set(data.new_val.guild, data.new_val);
            console.log(data);
            log.importSetting(settings);
        });
    });
    log.importSetting(settings);
    log.init(Client);
    Client.user.setGame('type $help').catch(console.error);
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

Client.on('guildCreate', async (guild) => {
    console.info(`Guild "${Client.guilds.get(guild).name}" was added in "setting" table`);
    await db.createSetting(guild.id).catch(console.error);
});

Client.on('guildMemberUpdate', (oldMember, newMember) => {
    if (!oldMember.roles.has(config.reposter) && newMember.roles.has(config.reposter)) {
        db.createListenedRole(oldMember.guild.id, config.reposter, oldMember.id).catch(console.error);
    }
    if(oldMember.roles.has(config.reposter) && !newMember.roles.has(config.reposter)) {
        db.endListenedRole(oldMember.guild.id, config.reposter, oldMember.id).catch(console.error);
    }
});

Client.on('typingStart', (channel, user) => {
    if(user.id === '211208289206272001' && trigger === false) { //211208289206272001
        channel.send("barry is writing");
        console.log(channel.name + new Date);
        trigger = true;
    }
});

Client.on('presenceUpdate', (oldMember, newMember) => {
    if(oldMember.id === '306418399242747906') {
        Client.channels.get('297150134834167809').send("barry went " + newMember.presence.status);
        console.log("barry went " + newMember.presence.status + " at " + Date.now());
    }
});

Client.on('message', message => {
    if (message.author.bot) return;
    let timestamp = new Date();
    if(config.env === "dev" && message.author.id !== config.discord.owner) return ;
    //money add with message
    money.perMessage(message.guild.id, message.author.id).catch(console.error);
    //invite delete system
    if(message.content.includes("discord.gg" || "https://discord.gg/" || "www.discord.gg/" || "https://discord.gg" || "https:/ /discord.gg" || "www" && "discord" && "gg" || "https" && "discord" && "gg")) {
        Client.fetchInvite(message.content.split("gg/")[1].split(" ")[0]).then(m => {
            if(m.guild.id === "242655328410402816") {
                message.channel.send("from 9i");
            } else {
                message.channel.send("from other");
            }
        });
    }
    //interaction
    if(message.content.startsWith("<@" + Client.user.id + ">, what should we do of her ?")) {
        message.channel.send("throw her in a pit and let me do the rest")
    }
    if(message.content.startsWith("<@" + Client.user.id + ">, what should we do of him ?")) {
        message.channel.send("throw him in a pit and let me do the rest")
    }
    //emoji delete system
    if (isEmoji(message.content) === true && message.channel.id !== "249626680434491392" && config.env !== "dev") {
        if (message.author.bot) return;
        console.log(timestamp.getFullYear() + '-' + (timestamp.getMonth() + 1) + '-' + timestamp.getDate() + ' ' + timestamp.getHours() + ':' + timestamp.getMinutes() + "there is an emoji here : " + message.channel.name + " ,by : " + message.author.username + '#' + message.author.discriminator);
        message.delete();
        message.reply("***GTFO RETARD AND READ THE RULES IN *** <#242655328410402816> <:feelsrageman:246603943768096769>").then(m => {
            setTimeout(function() {
                m.delete();
            }, 7000);
        });
    }
    //server emote analytics
    if(!message.author.bot && config.env !== "dev") {
        let serverEmotes = message.guild.emojis.array();
        let emoteStack = message.content.match(/<:(\w+):(\d+)>/g);
        if (emoteStack !== null) {
            for (let i = 0; i<serverEmotes.length; i++) {
                let emote = "<:" + serverEmotes[i].name + ":" + serverEmotes[i].id + ">";
                if (emoteStack.includes(emote)) {
                    db.createAnalytic(message.guild.id, message.channel.id, emote, message.author.id).catch(console.error);
                    console.log(emote);
                }
            }
        }
    }
    //command handler
    if (message.content.startsWith(config.discord.prefix) && settings !== undefined || settings !== undefined && message.content.startsWith(settings.get(message.guild.id).prefix)) {
        const prefix = (message.content.startsWith(settings.get(message.guild.id).prefix) ? settings.get(message.guild.id).prefix : config.discord.prefix);
        if (message.channel.id==="257541472772030464") return;
        let member = message.guild.member(Client.users.get(message.author.id));
        let role = check(member);
        let guild = message.guild;
        let args = message.content.split(' ');
        let command = args[0].slice(prefix.length);
        args.splice(0, 1);

        if (command in Client.commands) {
            console.log('[' + timestamp.getFullYear() + '-' + (timestamp.getMonth() + 1) + '-' + timestamp.getDate() + ' ' + timestamp.getHours() + ':' + timestamp.getMinutes() + '] [' + message.author.username + '#' + message.author.discriminator + '] [' + message.author.id + '] ['+ message.channel.name + "] " + command);
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
    //'\ud83c[\udf00-\udfff]', // U+1F300 to U+1F3FF
    //'\ud83d[\udc00-\ude4f]', // U+1F400 to U+1F64F // U+1F680 to U+1F6FF // U+263A // 1F600 - 1F636 // U+1F621
    let ranges = [
        '\ud83d[\ude00-\udeff]'
    ];
    if (str.match(ranges.join('|')) && !str.match('\u{1F621}')) {
        return true;
    } else {
        return false;
    }
}

process.on("unhandledRejection", err => {
    console.error("Uncaught Promise Error: \n" + err.stack);
});

exports.Client = Client;
