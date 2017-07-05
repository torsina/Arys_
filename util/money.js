const money = module.exports = {};
const db = require('./rethinkdb');
const config = require('../config/config');

money.add = async (guild, member, amount) => {
    await db.changeMoney(guild, member, amount).catch(e => {return e.message})
};

money.perMessage = async (guild, member) => {
    let setting = await db.getSetting(guild);
    let doc = await db.getUser(guild, member);
    setting = setting[0];
    doc = doc[0];
    if(!setting.money || !setting.money.wait) {
        if(doc.money.lastGet + config.money.wait > Date.now()) return;
    } else {
        if(doc.money.lastGet + setting.money.wait > Date.now()) return;
    }
    let money;
    if(setting.money.range) money = Math.random() * (setting.money.range.max - setting.money.range.min) + setting.money.range.min;
    else money = Math.random() * (config.money.range.max - config.money.range.min) + config.money.range.min;
    await db.changeMoney(guild, member, money, true).catch(e => {throw new Error(e)});
};
