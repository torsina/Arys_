const db = module.exports = {};
let dbName = "Arys";
const config = require('../config/config');
const assign = require('assign-deep');
const r = require("rethinkdbdash")({
    host: "192.168.1.30",
    port: "28015",
    db: dbName
});

db.init = async (Client) => {
    let dbs = await r.dbList().run();
    if(!~dbs.indexOf(dbName)) {
        console.info(`Creating database ${dbName}...`);
        await r.dbCreate(dbName).run();
    }

    let tableList = await r.tableList().run(), tableWait = [];
    let tablesExpected = [
        "setting", "post", "user", "event", "analytic", "guildMember", "guildChannel", "shopItem", "shopCategory", "guildRole", "autoRole"
    ];
    let indexExpected = [
        {table: "analytic", index: "analytic_guild", rows: ["guild"]},
        {table: "analytic", index: "analytic_guild_date", rows: ["guild", "date"]},
        {table: "post", index: "post_guild_message", rows: ["guild", "message"]},
        {table: "post", index: "post_guild_file_image", rows: ["guild", "file", "image"]},
        {table: "setting", index: "setting_guild", rows: ["guild"]},
        {table: "guildMember", index: "guildMember_guild_member", rows: ["guild", "member"]},
        {table: "user", index: "user_member", rows: ["member"]},
        {table: "shopItem", index: "shopItem_guild", rows: ["guild"]},
        {table: "shopItem", index: "shopItem_guild_category", rows: ["guild", "category"]},
        {table: "shopItem", index: "shopItem_guild_category_id", rows: ["guild", "category", "id"]},
        {table: "shopCategory", index: "shopCategory_guild", rows: ["guild"]},
        {table: "shopCategory", index: "shopCategory_guild_category", rows: ["guild", "category"]},
        {table: "guildRole", index: "guildRole_guild", rows: ["guild"]},
        {table: "guildRole", index: "guildRole_guild_role", rows: ["guild", "role"]},
        {table: "guildChannel", index: "guildChannel_guild", rows: ["guild"]},
        {table: "guildChannel", index: "guildChannel_guild_channel", rows: ["guild", "channel"]},
        {table: "autoRole", index: "autoRole_guild", rows: ["guild"]},
        {table: "autoRole", index: "autoRole_guild_role", rows: ["guild", "role"]}
    ];
    let indexes = [];
    for(let table of tablesExpected) {
        if(!~tableList.indexOf(table)) {
            console.info(`Creating "${table}" table...`);
            await r.tableCreate(table).run();
        }
        let indexList = await r.table(table).indexList().run();
        for(let index of indexList) {
            if(index !== "") indexes.push({table: table, index: index});
        }
    }
    for(let index of indexExpected) {
        if(!indexContainsObject(index, indexes)) {
            await r.table(index.table).indexCreate(index.index, index.rows.map(i => r.row(i))).run();
            console.info(`Creating index of "${index.index}" in "${index.table}" table...`);
            await r.table(index.table).indexWait(index.index).run();
            console.info(`Index "${index.index}" in "${index.table}" table is set up`);
        }
    }
    let guildExpected = Client.guilds.keys(); //array of joinned guild id
    for(let guild of guildExpected) { //guild is a single guild id
        let entry = await r.table('setting').getAll([guild], {index: "setting_guild"}).run();
        if(entry.length === 0) {
            await db.createSetting(guild).catch(console.error);
            console.info(`Guild "${Client.guilds.get(guild).name}" was added in "setting" table`);
        }
    }
    Client.guilds.forEach(async function(guild) {
        let setting = await db.getSetting(guild.id).catch(console.error);
        if(setting === undefined) {
            await db.createSetting(guild.id).catch(console.error);
        }
    });
    await Promise.all(tableWait);
    console.log(`rethinkdb initialized`);
    return true;
};

function indexContainsObject(obj, list) {
    for(let i = 0; i < list.length; i++) {
        if (list[i].table === obj.table ) {
            if (list[i].index === obj.index) return true;
        }
    }
    return false;
}

db.createSetting = async (guild) => {
    let query = {
        guild: guild,
        enter: Date.now(),
        lastSave: Date.now(),
    };
    return await r.table('setting').insert(query).run();
};

db.getSettings = async () => {
    let doc =  await r.table('setting').run();
    let map = new Map();
    for(let subDoc of doc) {
        map.set(subDoc.guild, subDoc);
    }
    return map;
};

db.getSetting = async (guild) => {
    let doc = await r.table('setting').getAll([guild], {index: "setting_guild"}).run();
    return doc[0];
};

db.streamSetting = async () => {
    return await r.table('setting').changes().run();
};

db.setPrefix = async (guild, prefix) => {
    return await r.table('setting').getAll([guild], {index: "setting_guild"}).update({prefix: prefix, lastSave: Date.now()}).run();
};

db.getPrefix = async (guild) => {
    let doc = await r.table('setting').getAll([guild], {index: "setting_guild"}).run();
    return doc[0].prefix;
};

db.deletePrefix = async (guild) => {
    return await r.table('setting').getAll([guild], {index: "setting_guild"}).replace(r.row.without('prefix')).update({lastSave: Date.now()}).run();
};

db.setMoneyName = async (guild, name) => {
    return await r.table('setting').getAll([guild], {index: "setting_guild"}).update({money: {name: name}, lastSave: Date.now()}).run();
};

db.deleteMoneyName = async (guild) => {
    return await r.table('setting').getAll([guild], {index: "setting_guild"}).replace(r.row.without({money: {name: true}})).run();
};

db.setMoneyDefaultAmount = async (guild, amount) => {
    if(amount < 0) throw new Error("you can't use negative number for that");
    return await r.table('setting').getAll([guild], {index: "setting_guild"}).update({money: {amount: amount}, lastSave: Date.now()}).run();
};

db.deleteMoneyDefaultAmount = async (guild) => {
    return await r.table('setting').getAll([guild], {index: "setting_guild"}).replace(r.row.without({money: {amount: true}})).run();
};

db.setMoneyWait = async (guild, time) => {
    return await r.table('setting').getAll([guild], {index: "setting_guild"}).update({money: {wait: time}, lastSave: Date.now()}).run();
};

db.deleteMoneyWait = async (guild) => {
    return await r.table('setting').getAll([guild], {index: "setting_guild"}).replace(r.row.without({money: {wait: true}})).run();
};

db.setMoneyRange = async (guild, min, max) => {
        return await r.table('setting').getAll([guild], {index: "setting_guild"}).update({money: {range: {min: min, max: max}}, lastSave: Date.now()}).run();
};

db.deleteMoneyRange = async (guild) => {
    return await r.table('setting').getAll([guild], {index: "setting_guild"}).replace(r.row.without({money: {range: true}})).run();
};

db.setMoneyDaily = async (_guild, _value) => {
    return await r.table('setting').getAll([_guild], {index: "setting_guild"}).update({money: {daily: {amount: _value}}, lastSave: Date.now()}).run();
};

db.deleteMoneyDaily = async (_guild) => {
    return await r.table('setting').getAll([_guild], {index: "setting_guild"}).replace(r.row.without({money: {daily: {amount: true}}})).run();
};

db.setMoneyBetted = async (_guild, _amount) => {
    if(!isNaN(parseInt(_amount)) && parseInt(_amount) >= 0) {
        let setting = await db.getSetting(_guild);
        if(!setting.money) setting.money = {};
        if(!setting.money.betted) setting.money.betted = parseInt(_amount);
        else setting.money.betted += parseInt(_amount);
        setting.money.lastSave = Date.now();
        return await r.table('setting').get(setting.id).update(setting).run();
    } else if(isNaN(parseInt(_amount))) {
        throw new Error('Amount is not a number');
    } else if(parseInt(_amount) < 0) {
        throw new Error("Amount can't be negative")
    }
};

db.getMoneyBetted = async (_guild) => {
    let doc = await db.getSetting(_guild);
    if(!doc.money || !doc.money.betted) return db.setMoneyBetted(_guild, 0);
    return doc.money.betted;
};

db.getGuildMember = async (guild, member) => {
    let doc = await r.table('guildMember').getAll([guild, member], {index: "guildMember_guild_member"}).run();
    return doc[0];
};

db.deleteGuildMember = async (guild, member) => {
    return await r.table('guildMember').getAll([guild, member], {index: "guildMember_guild_member"}).delete().run();
};

db.changeMoney = async (guild, member, amount, options = {}) => {
    console.time('money');
    let guildMember = await db.getGuildMember(guild, member);
    let user = await r.table('user').getAll(member, {index: "user_member"}).run();
    let setting = await db.getSetting(guild);
    //guildMember object has a guild scope, user object does not
    if(!guildMember) {
        guildMember = {};
    }
    if(!user) {
        user = {};
    }
    if(!guildMember.money) { //create bank account
        guildMember.money = {};
        if(setting.money && setting.money.amount) {
            guildMember.money.amount = setting.money.amount;
        } else {
            guildMember.money.amount = config.money.amount;
        }
    }
    if(!user.money) {
        user.money = {};
        user.money.amount = config.money.amount;
    }
    if(isNaN(amount)) throw new Error('Amount is not a number.');
    if(options.isMessage === true) {
        console.log("trigger");
        guildMember.money.lastGet = Date.now();
        user.money.amount += parseInt(amount);

    }
    if((guildMember.money.amount + parseInt(amount)) < 0 && options.force === false || options.scope === "user" && user.money.amount + parseInt(amount) < 0 && options.force === false) {
        throw new Error("You don't have enough money for that.");
    }
    if(!options.scope) { //guild is default scope
        guildMember.money.amount += parseInt(amount);
    } else {
        user.money.amount += parseInt(amount);
    }
    if(!guildMember.member) {//finalizing object if new
        guildMember.member = member;
        guildMember.guild = guild;
        await r.table('guildMember').insert(guildMember).run();
    } else {
        await r.table('guildMember').get(guildMember.id).replace(guildMember).run();
    }
    if(!user.member) {
        user.member = member;
        await r.table('user').insert(guildMember).run();
    } else {
        await r.table('user').get(guildMember.id).replace(guildMember).run();
    }
    return true;
};

db.setDaily = async (_guild, _member) => {
    return await r.table('guildMember').getAll([_guild, _member], {index: "guildMember_guild_member"}).update({daily: Date.now(), lastSave: Date.now()}).run();
};

db.getMoney = async (member, guild) => {
    if(guild) {
        let doc = await r.table('guildMember').getAll([guild, member], {index: "guildMember_guild_member"}).run();
        return doc[0].money;
    } else {
        let doc = await r.table('user').getAll([member], {index: "user_member"}).run();
        return doc[0].money;
    }
};

db.addShopCategory = async (_guild, _category, _header, _type) => {
    let doc = {
        guild: _guild,
        category: _category,
        header: _header,
        type: _type
    };
    return await r.table('shopCategory').insert(doc).run();
};

db.getShopsCategory = async (_guild, _category) => {
    if(_guild) {
        if(_category) {
            let doc = await r.table('shopCategory').getAll([_guild, _category], {index: "shopCategory_guild_category"}).run();
            doc = doc[0];
            return doc;
        } else {
            let doc = await r.table('shopCategory').getAll([_guild], {index: "shopCategory_guild"}).run();
            let array = [];
            for(let item of doc) {
                array.push(item);
            }
            return array;
        }
    } else {
        throw new Error('No guild scope was used');
    }
};

db.addShopItem = async (_guild, _category, _id, _price) => {
    let doc = await db.getShops(_guild, _category, _id);
    if(!doc) {
        doc = {
            guild: _guild,
            category: _category,
            id: _id,
            price: _price
        };
        return await r.table('shopItem').insert(doc).run();
    } else throw new Error('This item is already registered.')
};

db.deleteShopItem = async (_guild, _category, _id) => {
    let doc = await db.getShops(_guild, _category, _id);
    if(!doc) throw new Error("This item does not exist in this category.");
    return await r.table('shopItem').getAll([_guild, _category, _id], {index: "shopItem_guild_category_id"}).delete().run();
};

db.getShops = async (_guild, _category, _id) => {
    if(_guild) {
        if(_category) {
            if(_id) {
                let doc = await r.table('shopItem').getAll([_guild, _category, _id], {index: "shopItem_guild_category_id"}).run();
                return doc[0];
            }
            return await r.table('shopItem').getAll([_guild, _category], {index: "shopItem_guild_category"}).orderBy(r.desc('price')).run();
        }
        return await r.table('shopItem').getAll(_guild, {index: "shopItem_guild"}).run();
    } else {
        throw new Error('No guild scope was used');
    }
};

db.addLogChannel = async (_guild, _channel, _type) => {
    let doc = await db.getSetting(_guild);
    doc.lastSave = Date.now();
    if(!doc.logChannel) doc.logChannel = {};
    if(!doc.logChannel[_type]) doc.logChannel[_type] = [];
    if(doc.logChannel[_type].includes(_channel)) {
        throw new Error('Channel is already registered');
    }
    else doc.logChannel[_type].push(_channel);
    return await r.table('setting').get(doc.id).update(doc).run();
};

db.removeLogChannel = async (_guild, _channel, _type) => {
    let doc = await db.getSetting(_guild);
    let index = doc.logChannel[_type].indexOf(_channel);
    doc.logChannel[_type].splice(index, 1);
    if(doc.logChannel[_type].length === 0) delete doc.logChannel[_type];
    return await r.table('setting').get(doc.id).replace(doc).run();
};

db.getLogChannel = async (guild) => {
    let doc = await r.table('setting').getAll([guild], {index: "setting_guild"}).run();
    return doc[0];
};

db.setRolePerm = async (_guild, _role, _bitField, _message) => {
    let doc = await db.getRolePerm(_guild, _role);
    if(!doc) {
        doc = {
            guild: _guild,
            role: _role,
            position: _message.guild.roles.get(_role).position
        };
        doc.perm = _bitField;
        return await r.table('guildRole').insert(doc).run();
    } else {
        doc.perm = assign(doc.perm, _bitField);
        if(doc.position !== _message.guild.roles.get(_role).position) doc.position = _message.guild.roles.get(_role).position;
        return await r.table('guildRole').get(doc.id).replace(doc).run();
    }
};

db.getRolePerm = async (_guild, _role, _message) => {
    if(!_guild) throw new Error('No guild scope provided');
    if(_role) {
        let doc = await r.table('guildRole').getAll([_guild, _role], {index: "guildRole_guild_role"}).run();
        if(!doc) {
            return db.setRolePerm(_guild, _role, {}, _message).catch(console.error);
        }
        return doc[0];
    } else {
        return await r.table('guildRole').getAll([_guild], {index: "guildRole_guild"}).orderBy('position').run();
    }
};

db.setGuildMemberPerm = async (_guild, _member, _bitFields) => {
    if(!_bitFields instanceof Object) throw new Error('bitField must be an object');
    let guildMember = await db.getGuildMember(_guild, _member);
    if(!guildMember) {
        guildMember = {};
        guildMember.guild = _guild;
        guildMember.member = _member;
        guildMember.perm = _bitFields;
        return await r.table('guildMember').insert(guildMember).run();
    } else {
        guildMember.perm = _bitFields;
        return await r.table('guildMember').get(guildMember.id).update(guildMember);
    }
};

db.setChannelPerm = async (_guild, _channel, _bitField) => {
    if(_guild && _channel && _bitField) {
        let doc = await db.getChannel(_guild, _channel).catch(console.error);
        console.log(doc);
        if(!doc) {
            doc = {};
            doc.guild = _guild;
            doc.channel = _channel;
            doc.own = _bitField;
            return await r.table('guildChannel').insert(doc).run();
        }
        doc.own = _bitField;
        return await r.table('guildChannel').replace(doc).run();
    } else if(!_guild) throw new Error('No guild scope used');
    else if(!_channel) throw new Error('No channel used');
    else if(!_bitField) throw new Error('No bitField used');
};

db.getChannel = async (_guild, _channel) => {
    if(typeof _guild) {
        if(_channel) {
            let doc = await r.table('guildChannel').getAll([_guild, _channel], {index: "guildChannel_guild_channel"}).run();
            if(doc.length > 1) throw new Error("Multiple channels were found, report this to my creator");
            if(!doc) throw new Error("No channel was found with that id");
            return doc[0];
        }
        let doc = await r.table('guildChannel').getAll([_guild], {index: "guildChannel_guild"}).run();
        if(!doc) throw new Error("No channel was found in that guild");
        return doc;
    }
    throw new Error("No guild scope was used")
};

db.createPost = async (image, message, file, channel, guild) => {
    let query = {
        image: image,
        message: message,
        file: file,
        channel: channel,
        guild: guild,
        report_count: 0
    };
    return await r.table('post').insert(query).run();
};

db.getPost = async (image, file, guild) => {
    return await r.table('post').getAll([guild, file, image], {index: "post_guild_file_image"}).run();
};

db.reportPost = async (guild, message) => {
    let doc = await r.table('post').getAll([guild, message], {index: "post_guild_message"}).run();
    return await r.table('post').get(doc[0].id).update({report_count: doc[0].report_count+1}).run();
};

db.deletePost = async (guild, message) => {
    return await r.table('post').getAll([guild, message], {index: "post_guild_message"}).delete().run();
};

db.createListenedRole = async (_guild, _role) => {
    let setting = await db.getSetting(_guild);
    if (!setting.listenedRoles) setting.listenedRoles = [];
    if (setting.listenedRoles.indexOf(_role) > 0) throw new Error("Listened role is already registered.");
    setting.listenedRoles.push(_role);
    return await r.table('setting').get(setting.id).update(setting).run();
};

db.deleteListenedRole = async (_guild, _role) => {
    let setting = await db.getSetting(_guild);
    if (setting.listenedRoles.indexOf(_role) < 0) throw new Error("Listened role doesn't exist");
    setting.listenedRoles.splice(setting.listenedRoles.indexOf(_role), 1);
    if (setting.listenedRoles.length === 0) delete setting.listenedRoles;
    return await r.table('setting').get(setting.id).replace(setting).run();
};

db.getListenedRole = async (_guild) => {
    let setting = await db.getSetting(_guild);
    return setting.listenedRoles;
};

db.addGuildMemberListenedRole = async (_guild, _member, _role) => {
    let guildMember = await db.getGuildMember(_guild, _member);
    if (!guildMember) {
        guildMember = {};
    }
    if (!guildMember.listenedRoles) guildMember.listenedRoles = [];
    if (guildMember.listenedRoles.includes(_role)) throw new Error("Listened role is already registered.");
    guildMember.listenedRoles.push(_role);
    if (!guildMember.guild) {
        guildMember.guild = _guild;
        guildMember.member = _member;
        return await r.table('guildMember').insert(guildMember).run()
    } else {
        return await r.table('guildMember').get(guildMember.id).update(guildMember).run();
    }

};

db.deleteGuildMemberListenedRoles = async (_guild, _member, _role) => {
    let guildMember = await db.getGuildMember(_guild, _member);
    if (guildMember.listenedRoles.indexOf(_role) < 0) throw new Error("Listened role doesn't exist");
    guildMember.listenedRoles.splice(guildMember.listenedRoles.indexOf(_role), 1);
    if (guildMember.listenedRoles.length === 0) delete guildMember.listenedRoles;
    return await r.table('guildMember').get(guildMember.id).replace(guildMember).run();
};
db.createAnalytic = async (guild, channel, item, member, date) => {
    let query = {
        item: item,
        user: member,
        channel: channel,
        guild: guild,
        date: Date.now()
    };
    return await r.table('analytic').insert(query).run();
};

db.countAnalytic = async (guild) => {
    let doc = await r.table('analytic').getAll([guild], {index: "analytic_guild"}).run();
    let nameStack = [...new Set(doc.map(analytic => analytic.item))];
    if(nameStack.length !== 0) {
        let stack = [];
        for(let i=0;i<nameStack.length;i++) {
            let name = nameStack[i];
            let count = doc.filter(function (o) {
                return (o.item === name);
            }).length;
            stack.push(name + " " + count);
        }
        return stack;
    }
};

db.countAnalyticByDate = async (guild, min, max) => {
    min = min ? new Date(min).getTime() : 0;
    max = max ? new Date(max).getTime() : Date.now();
    console.log("min : " + new Date(min));
    console.log("max : " + new Date(max));
    let days = Math.floor((max - min) / 86400000); //number of day
    let stack = [];
    console.log(Date.now());
    console.log("min : " + min + " max : " + max + " guild : " + guild);
    let doc  = await r.table("analytic").between([guild, min], [guild, max], { index: "analytic_guild_date" }).run();
    console.log(days);
    for(let i=0; i<days;i++) { //for each day
        let start = min + i*86400000; //a =
        let end = start + 86400000;
        stack[i] = {};
        let subDoc = doc.filter(function (o) {
            let date = parseInt(o.date);
            return (date >= parseInt(start) && date <= parseInt(end));
        });
        console.log(subDoc.length + "max : " + doc.length +", start : "+ new Date(start) + " , stop : " + new Date(end) + " , i: " + i);
        let nameStack = [...new Set(subDoc.map(analytic => analytic.item))];
        let subStack = [];
        if(nameStack.length !== 0) {
            for(let j=0;j<nameStack.length;j++) {
                let name = nameStack[j];
                let count = subDoc.filter(function (o) {
                    return (o.item === name);
                }).length;
                subStack.push(name + " " + count);
            }
        }
        stack[i].value = subStack;
        stack[i].start = start;
        stack[i].end = end;
    }
    return stack;
};

db.createAutoRole = async (_guild, _role) => {
    let check = await db.getAutoRole(_guild, _role);
    if(check) throw new Error('Role is already in the list.');
    let query = {
        guild: _guild,
        role: _role
    };
    return await r.table('autoRole').insert(query).run().catch(console.error);
};

db.getAutoRole = async (_guild, _role) => {
    let doc = await r.table('autoRole').getAll([_guild, _role], {index: "autoRole_guild_role"}).run();
    if(doc.length > 1) throw new Error('Found more than 1 result, contact dev for more info');
    return doc[0];
};

db.getAutoRoles = async (_guild) => {
    return await r.table('autoRole').getAll([_guild], {index: "autoRole_guild"}).run();
};

db.deleteAutoRole = async (_guild, _role) => {
    let check = await db.getAutoRole(_guild, _role);
    if(!check) throw new Error('Role is not in the list');
    return await r.table('autoRole').getAll([_guild, _role], {index: "autoRole_guild_role"}).delete().run();
};