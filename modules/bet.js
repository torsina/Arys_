const perms = require('../util/perm');
const db = require('../util/rethinkdb');
const money = require('../util/money');
const config = require('../config/config');
const Discord = require('discord.js');

const bitField = {
    help: 1 << 0,
    base: 1 << 1
};

module.exports = {
    help: 'Get lucky, or not.',
    func: async(client, msg, args,  guildMember) => {
        //if(config.env === "dev") return;
        try{await perms.check(guildMember, msg.channel.id, "bet.base")}catch(e) {return msg.channel.send(e.message)}
        if(parseInt(args[1]) < 50) return msg.channel.send("Your bid is too low!");
        let random = Math.random();
        let chance = 0.5;
        let choice = args[0];
        let setting = await db.getSetting(msg.guild.id);
        let multiplier;
        let name = await money.getName(msg.guild.id);
        let amount = await money.getAmount(msg.author.id, msg.guild.id);
        if(amount < parseInt(args[1])) return msg.channel.send("You don't have enough credits for that.");
        if(setting.money && setting.money.bet)multiplier = setting.money.bet.multiplier;
        else multiplier = config.money.bet.multiplier;
        await db.setMoneyBetted(msg.guild.id, parseInt(args[1]));
        let embed = new Discord.RichEmbed();
        embed.setColor("GOLD");
        if(random > 0 && random < chance) { //head
            if(choice === "h") {
                await db.changeMoney(msg.guild.id, msg.author.id, Math.floor(parseInt(args[1]*multiplier))).catch(e => {msg.channel.send(e.message)}).then(async () => {
                    embed.setDescription(msg.author.toString() + ", you won " + Math.floor(parseInt(args[1]*multiplier)) + " " + name + "!");
                    embed.addField("Old amount: ", amount + " " + name);
                    embed.addField("New amount: ", await money.getAmount(msg.author.id, msg.guild.id) + " " + name);
                    msg.channel.send({embed});
                });
            } else {
                await db.changeMoney(msg.guild.id, msg.author.id, -parseInt(args[1])).catch(e => {msg.channel.send(e.message)}).then(async () => {
                    embed.setDescription(msg.author.toString() + ", you've lost " + parseInt(args[1]) + " " + name + "!");
                    embed.addField("Old amount: ", amount + " " + name);
                    embed.addField("New amount: ", await money.getAmount(msg.author.id, msg.guild.id) + " " + name);
                    msg.channel.send({embed});
                });
            }
        } else if(random > chance && random < chance * 2) { //tails
            if(choice === "t") {
                await db.changeMoney(msg.guild.id, msg.author.id, Math.floor(parseInt(args[1]*multiplier))).catch(e => {msg.channel.send(e.message)}).then(async () => {
                    embed.setDescription(msg.author.toString() + ", you won " + Math.floor(parseInt(args[1]*multiplier)) + " " + name + "!");
                    embed.addField("Old amount: ", amount + " " + name);
                    embed.addField("New amount: ", await money.getAmount(msg.author.id, msg.guild.id) + " " + name);
                    msg.channel.send({embed});
                });
            } else {
                await db.changeMoney(msg.guild.id, msg.author.id, -parseInt(args[1])).catch(e => {msg.channel.send(e.message)}).then(async () => {
                    embed.setDescription(msg.author.toString() + ", you lost " + parseInt(args[1]) + " " + name + "!");
                    embed.addField("Old amount: ", amount + " " + name);
                    embed.addField("New amount: ", await money.getAmount(msg.author.id, msg.guild.id) + " " + name);
                    msg.channel.send({embed});
                });
            }
        } else {
            await db.changeMoney(msg.guild.id, msg.author.id, -parseInt(args[1])).catch(e => {msg.channel.send(e.message)}).then(async () => {
                embed.setDescription(msg.author.toString() + ", you lost " + parseInt(args[1]) + " " + name + "!");
                embed.addField("Old amount: ", amount + " " + name);
                embed.addField("New amount: ", await money.getAmount(msg.author.id, msg.guild.id) + " " + name);
                msg.channel.send({embed});
            });
        }
    }
};
module.exports.bitField = bitField;