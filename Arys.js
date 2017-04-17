// 1. Librairies
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const sqlite3 = require('sqlite3').verbose();
const Client = new Discord.Client();
//const hexColor = 0xE16699;

const db = new sqlite3.Database(config.db.file);
var post_id;
Client.login(config.discord.token.bot);


// Au chargement du programme
Client.on('ready', () => {
    console.time('loading');
    Client.load();

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
}

Client.on('message', message => {

    //if(message.author.id=='245614884786667520') {
        if (message.content.startsWith(config.discord.prefix)) {
            if (message.author.bot) return;

            args = message.content.split(' ');
            command = args[0].slice(config.discord.prefix.length);
            args.splice(0, 1);

            if (command in Client.commands) {
                let timestamp = new Date();
                console.log('[' + timestamp.getFullYear() + '-' + (timestamp.getMonth() + 1) + '-' + timestamp.getDate() + ' ' + timestamp.getHours() + ':' + timestamp.getMinutes() + '] [' + message.author.username + '#' + message.author.discriminator + '] [' + message.author.id + '] ' + command);
                Client.commands[command].func(Client, message, args);
                console.log(args);
            }
        }
    else{return;}
});

process.on("unhandledRejection", err => {
    console.error("Uncaught Promise Error: \n" + err.stack);
});

exports.db = db;
exports.Client = Client;
