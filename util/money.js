const money = module.exports = {};
const db = require('./rethinkdb');
const config = require('../config/config');
const fs = require('fs');
const path = require('path');
const Canvas = require('canvas');
Canvas.registerFont(fontFile('../Whitney_Book.ttf'), {family: 'Whitney'});

money.add = async (guild, member, amount) => {
    await db.changeMoney(guild, member, amount).catch(e => {return e.message})
};

money.perMessage = async (guild, member) => {
    let setting = await db.getSetting(guild).catch(console.error);
    let doc = await db.getGuildMember(guild, member);
    doc = doc[0];
    if(doc) {
        if(!setting.money && doc.money || !setting.money.wait && doc.money) {
            if(doc.money.lastGet + config.money.wait > Date.now()) return;
        } else {
            if(doc.money.lastGet + setting.money.wait > Date.now()) return;
        }
    }
    let money;
    if(setting && setting.money && setting.money.range) money = Math.random() * (setting.money.range.max - setting.money.range.min) + setting.money.range.min;
    else money = Math.random() * (config.money.range.max - config.money.range.min) + config.money.range.min;
    await db.changeMoney(guild, member, money, true).catch(console.error);
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

money.shop = async (guild, category, msg, int) => {
    let list = await db.getShops(guild, category);
    let max;
    if (list.length - int >= 18) {
        max = int + 18;
    } else {
        max = list.length - int;
    }
    console.log(list);
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
        //let length = Math.log(parseInt(list[i].price)) * Math.LOG10E + 1 | 0;
        //if(length > 9) return console.error("element price was too big");
        console.log("TRIGGER " + i+int);
        ctx.fillStyle = msg.guild.roles.find("name", list[i+int].item).hexColor;
        ctx.fillText(list[i+int].item, 28, (i + 1) * 24 + i * 8);
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
