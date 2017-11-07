const money = module.exports = {};
const db = require('./rethinkdb');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');
const Canvas = require('canvas');
Canvas.registerFont(fontFile('../Whitney_Book.ttf'), {family: 'Whitney'});

money.amount = (_array) => {
    if(!(_array instanceof Array)) throw new Error("Value is not an array");
    let amount = parseInt(_array[1]);
    if(isNaN(amount) || amount < 0) throw new Error("Value must be a number");
    return amount;
};

money.add = async (guild, member, amount) => {
    await db.changeMoney(guild, member, amount).catch(e => {return e.message})
};

money.perMessage = async (guild, member) => {
    let setting = await db.getSetting(guild).catch(console.error);
    let doc = await db.getGuildMember(guild, member);
    if(doc) {
        if((!setting.money || !setting.money.wait) && doc.money) {
            if(doc.money && ((doc.money.lastGet + config.money.wait) > Date.now())) return;
        } else {
            if(doc.money && ((doc.money.lastGet + setting.money.wait) > Date.now())) return;
        }
    }
    let money;
    if(setting && setting.money && setting.money.range) money = Math.random() * (setting.money.range.max - setting.money.range.min) + setting.money.range.min;
    else money = Math.random() * (config.money.range.max - config.money.range.min) + config.money.range.min;
    await db.changeMoney(guild, member, money, { isMessage: true}).catch(console.error);
};

money.get = async (member, guild) => {
    return await db.getMoney(member, guild);
};

money.getAmount = async (member, guild) => {
    let doc = await db.getMoney(member, guild);
    return doc.amount;
};

money.getName = async (guild) => {
    let doc = await db.getSetting(guild);
    if(doc.money) {
        return doc.money.name || config.money.name;
    } else {
        return config.money.name;
    }
};

money.getDaily = async (_guild, _member, _other) => {
    await db.setDaily(_guild, _member).catch(console.error);
    console.log("trigger");
    let setting = await db.getSetting(_guild);
    let daily;
    if(setting.money && setting.money.daily && setting.money.daily.amount) {
        daily = setting.money.daily.amount;
    } else {
        daily = config.money.daily.amount;
    }
    if(!_other) {
        await db.changeMoney(_guild, _member, parseInt(daily)).catch(console.error);
        return daily;
    } else if(_other){
        let min, max;
        if(setting.money && setting.money.daily && setting.money.daily.min)min = setting.money.daily.min;
        else min = config.money.daily.range.min;
        if(setting.money && setting.money.daily && setting.money.daily.max)max = setting.money.daily.max;
        else max = config.money.daily.range.max;
        let money = daily + Math.random() * (max - min) + min;
        await db.changeMoney(_guild, _other, Math.floor(parseInt(money))).catch(console.error);
        return Math.floor(parseInt(money));
    }
};

money.shop = async (guild, category, msg, int) => {
    let list = await db.getShops(guild, category);
    for(let i=0;i<list.length;i++) {
        if(!msg.guild.roles.get(list[i].id)) {
            await db.deleteShopItem(guild, category, list[i].name).catch(console.error);
            list.slice(i, 1);
        }
    }
    let max;
    if (list.length - int >= 18) {
        max = 18;
    } else {
        max = list.length - int;
    }
    let canvas = new Canvas(402 * 2, max * 16 * 2);
    let ctx = canvas.getContext('2d');
    ctx.antialias = 'subpixel';
    for (let i = 0; i < list.length; i++) {
        ctx.fillStyle = isOdd(i) === 1 ? '#32363B' : '#36393E';
        ctx.fillRect(0, (i) * 16 * 2, 402 * 2, 16 * 2);
    }
    ctx.font = 'normal normal 24px Whitney';
    ctx.shadowColor = "black";
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 0;

    for (let i = 0; i < max; i++) {
        if(parseInt(i+int) >= list.length) break;
        if(config.env === "dev") {
            console.log("TRIGGER " + parseInt(i+int));
            console.log(list[i+int]);
        }
        ctx.fillStyle = msg.guild.roles.get(list[i+int].id).hexColor;
        ctx.fillText(msg.guild.roles.get(list[i+int].id).name, 28, (i + 1) * 24 + i * 8);
        ctx.fillStyle = "white";
        ctx.fillText(list[i+int].price, 402 * 2 - 65 * 2, (i + 1) * 24 + i * 8);
    }
    return new Promise((resolve, reject) => {
        canvas.toBuffer((err, buf) => {
            if (err) reject(err);
            resolve(buf);
        });
    });
};

function fontFile (name) {
    return path.join(__dirname, './', name)
}

function isOdd(num) { return num % 2;}
