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
        const bet = parseInt(args[1]);
        if (isNaN(bet)) return msg.channel.send("You can only use numbers !");
        if(bet < 50) return msg.channel.send("Your bid is too low!");
        let random = Math.random();
        let setting = await db.getSetting(msg.guild.id);
        let multiplier;
        let name = await money.getName(msg.guild.id);
        let amount = await money.getAmount(msg.author.id, msg.guild.id);
        if(amount < bet) return msg.channel.send("You don't have enough credits for that.");
        if(setting.money && setting.money.bet)multiplier = setting.money.bet.multiplier;
        else multiplier = config.money.bet.multiplier;
        await db.setMoneyBetted(msg.guild.id, parseInt(args[1]));
        let embed = new Discord.RichEmbed();

        let option;
        if (args[0].includes("h")) option = "head";
        else option = "tail";
        const win = args[1] * 0.98;
        if ((random <= 0.49 && option === "head") || (random <= 0.98 && random > 0.49 && option === "tail")) {
            await db.changeMoney(msg.guild.id, msg.author.id, Math.floor(parseInt(bet*multiplier))).catch(e => {msg.channel.send(e.message)}).then(async () => {
                embed.setDescription(msg.author.toString() + ", you won " + Math.floor(parseInt(bet*multiplier)) + " " + name + "!");
                embed.addField("Old amount: ", amount + " " + name);
                embed.addField("New amount: ", await money.getAmount(msg.author.id, msg.guild.id) + " " + name);
                msg.channel.send({embed});
            });
        } else {
            await db.changeMoney(msg.guild.id, msg.author.id, -parseInt(bet)).catch(e => {msg.channel.send(e.message)}).then(async () => {
                embed.setDescription(msg.author.toString() + ", you've lost " + parseInt(args[1]) + " " + name + "!");
                embed.addField("Old amount: ", amount + " " + name);
                embed.addField("New amount: ", await money.getAmount(msg.author.id, msg.guild.id) + " " + name);
                msg.channel.send({embed});
            });
        }
        embed.setColor("GOLD");
    }
};
module.exports.bitField = bitField;