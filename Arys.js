// 1. Librairies
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const sqlite3 = require('sqlite3').verbose();
const Client = new Discord.Client();
const db = new sqlite3.Database(config.db.file);
const roles = require('./config/perm/roles');
let reposter = JSON.parse(fs.readFileSync('./config/reposter.json', 'utf8'));
Client.login(config.discord.token.bot);
// Au chargement du programme
Client.once('ready', () => {
    console.time('loading');
    Client.load();
    roles.load();
    Client.user.setGame('type $help')
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
        let timestamp = new Date();
        let date = timestamp.getFullYear() + '-' + (timestamp.getMonth() + 1) + '-' + timestamp.getDate() + ' ' + timestamp.getHours() + ':' + timestamp.getMinutes();
        let prep = db.prepare("INSERT INTO reposter VALUES (?,?,?)");
        prep.run(oldMember.id, date, "");
    }
    if(oldMember.roles.has(config.reposter) && !newMember.roles.has(config.reposter)) {
        let timestamp = new Date();
        let date = timestamp.getFullYear() + '-' + (timestamp.getMonth() + 1) + '-' + timestamp.getDate() + ' ' + timestamp.getHours() + ':' + timestamp.getMinutes();
        db.run("UPDATE reposter SET end = '"+date+"' WHERE id='"+oldMember.id+"'");
    }
});

Client.on('message', message => {

    //if(message.author.id=='245614884786667520') {
        if(message.channel.id==="257541472772030464") {return;}

        if(message.content.startsWith("<@" + Client.user.id + ">, what should we do of her ?")) {
            message.channel.sendMessage("throw her in a pit and let me do the rest")
        }
        if (message.content.startsWith(config.discord.prefix)) {
            if (message.author.bot) return;
            if(message.author.id==="278720049080958976") {message.channel.sendMessage("go die in hell stupid fag"); return;}
            args = message.content.split(' ');
            command = args[0].slice(config.discord.prefix.length);
            args.splice(0, 1);

            //var id = message.mentions.roles.first().id;
            //let role = check(member);
            let member = message.guild.member(Client.users.get(message.author.id));
            let role = check(member);

            if (command in Client.commands) {
                let timestamp = new Date();
                console.log('[' + timestamp.getFullYear() + '-' + (timestamp.getMonth() + 1) + '-' + timestamp.getDate() + ' ' + timestamp.getHours() + ':' + timestamp.getMinutes() + '] [' + message.author.username + '#' + message.author.discriminator + '] [' + message.author.id + '] ' + command);
                Client.commands[command].func(Client, message, args, role);
                console.log(args);
            }
        }
    else{}
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

process.on("unhandledRejection", err => {
    console.error("Uncaught Promise Error: \n" + err.stack);
});

exports.db = db;
exports.Client = Client;