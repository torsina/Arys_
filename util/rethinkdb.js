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
        "setting", "post", "listenedRoles", "user", "event", "analytic", "guildMember", "shopItem", "shopCategory", "roles"
    ];
    let indexExpected = [
        {table: "analytic", index: "analytic_guild", rows: ["guild"]},
        {table: "analytic", index: "analytic_guild_date", rows: ["guild", "date"]},
        {table: "post", index: "post_guild_message", rows: ["guild", "message"]},
        {table: "post", index: "post_guild_file_image", rows: ["guild", "file", "image"]},
        {table: "listenedRoles", index: "listenedRoles_guild", rows: ["guild"]},
        {table: "listenedRoles", index: "listenedRoles_guild_role", rows: ["guild", "role"]},
        {table: "listenedRoles", index: "listenedRoles_guild_role_member", rows: ["guild", "role", "member"]},
        {table: "setting", index: "setting_guild", rows: ["guild"]},
        {table: "guildMember", index: "guildMember_guild_member", rows: ["guild", "member"]},
        {table: "user", index: "user_member", rows: ["member"]},
        {table: "shopItem", index: "shopItem_guild", rows: ["guild"]},
        {table: "shopItem", index: "shopItem_guild_category", rows: ["guild", "category"]},
        {table: "shopItem", index: "shopItem_guild_category_item", rows: ["guild", "category", "item"]},
        {table: "shopCategory", index: "shopCategory_guild", rows: ["guild"]},
        {table: "shopCategory", index: "shopCategory_guild_category", rows: ["guild", "category"]},
        {table: "roles", index: "roles_guild", rows: ["guild"]},
        {table: "roles", index: "roles_guild_role", rows: ["guild", "role"]}
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
        map.set(subDoc.guild, subDoc)
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

db.getGuildMember = async (guild, member) => {
    let doc = await r.table('guildMember').getAll([guild, member], {index: "guildMember_guild_member"}).run();
    return doc[0];
};

db.changeMoney = async (guild, member, amount, isMessage, scope) => {
    console.time('money');
    let guildMember = await db.getGuildMember(guild, member);
    let user = await r.table('user').getAll(member, {index: "user_member"}).run();
    let setting = await db.getSetting(guild);
    if(!guildMember) {
        guildMember = {};
    }
    if(!user) {
        user = {};
    }
    if(!guildMember.money) { //set
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
    if(isMessage === true) {
        guildMember.money.lastGet = Date.now();
        user.money.amount += parseInt(amount);
    }
    if((guildMember.money.amount + parseInt(amount)) < 0 || scope === "general" && (user.money.amount + parseInt(amount)) < 0) {
        throw new Error('Not enough credits for that.');
    }
    if(!scope) { //guild is default scope
        guildMember.money.amount += parseInt(amount);
    } else if(isMessage === false) {
        user.money.amount += parseInt(amount);
    }
    if(!guildMember.member) {
        guildMember.member = member;
        guildMember.guild = guild;
        await r.table('guildMember').insert(guildMember).run();
    } else {
        await r.table('guildMember').get(guildMember.id).update(guildMember).run();
    }
    if(!user.member) {
        user.member = member;
        await r.table('user').insert(guildMember).run();
    } else {
        await r.table('user').get(guildMember.id).update(guildMember).run();
    }
    return true;
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

db.addShopItem = async (_guild, _category, _item, _price) => {
    let doc = {
        guild: _guild,
        category: _category,
        item: _item,
        price: _price
    };
    return await r.table('shopItem').insert(doc).run();
};

db.getShops = async (guild, category, item) => {
    if(guild) {
        if(category) {
            if(item) {
                return await r.table('shopItem').getAll([guild, category, item], {index: "shopItem_guild_category_item"}).run();
            }
            return await r.table('shopItem').getAll([guild, category], {index: "shopItem_guild_category"}).orderBy(r.desc('price')).run();
        }
        return await r.table('shopItem').getAll(guild, {index: "shopItem_guild"}).run();
    } else {
        throw new Error('No guild scope was used');
    }
};

db.addLogChannel = async (guild, _channel, _type) => {
    let doc = await db.getSetting(guild);
    doc[0].lastSave = Date.now();
    if(doc[0].logChannel === undefined) {
        doc[0].logChannel = {};
        if(doc[0].logChannel[_type] === undefined) doc[0].logChannel[_type] = [];
    }
    if(doc[0].logChannel[_type].includes(_channel)) {
        throw new Error('channel is already registered');
    }
    else doc[0].logChannel[_type].push(_channel);
    return await r.table('setting').get(doc[0].id).update(doc[0]).run();
};

db.removeLogChannel = async (guild, _channel, _type) => {
    let doc = await r.table('setting').getAll([guild], {index: "setting_guild"}).run();
    delete doc[0].logChannel[_type][doc[0].logChannel[_type].indexOf(_channel)];
    return await r.table('setting').get(doc[0].id).update(doc[0]).run();
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
        return await r.table('roles').insert(doc).run();
    } else {
        doc.perm = assign(doc.perm, _bitField);
        if(doc.position !== _message.guild.roles.get(_role).position) doc.position = _message.guild.roles.get(_role).position;
        return await r.table('roles').get(doc.id).replace(doc).run();
    }
};

db.getRolePerm = async (_guild, _role) => {
    if(!_guild) throw new Error('No guild scope provided');
    if(_role) {
        let doc = await r.table('roles').getAll([_guild, _role], {index: "roles_guild_role"}).run();
        return doc[0];
    } else {
        return await r.table('roles').getAll([_guild], {index: "roles_guild"}).orderBy('position').run();
    }
};

db.setGuildMemberPerm = async (_guild, _member, _bitFields) => {
    if(!_bitFields instanceof Object) throw new Error('bitField must be an object');
    console.log(_bitFields);
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

db.createListenedRole = async (guild, role, member) => {
    let query = {
        role: role,
        member: member,
        guild: guild,
        enter: Date.now()
    };
    return await r.table('listenedRoles').insert(query).run();
};

db.endListenedRole = async (guild, role, member) => {
    let doc = await r.table('listenedRoles').getAll([guild, role, member], {index: "listenedRoles_guild_role_member"}).orderBy(r.row("exit")).run();
    return await r.table('listenedRoles').get(doc[0].id).update({exit: Date.now()}).run();

};

db.getListenedRole = async (guild, role, member) => {
    if(member === undefined) {
        if(role === undefined) {
            if(guild === undefined) return console.error("please put a guild scope to the query");
            return await r.table('listenedRoles').getAll([guild], {index: "listenedRoles_guild"}).orderBy(r.desc(r.row("exit"))).run();
        }
        return await r.table('listenedRoles').getAll([guild, role], {index: "listenedRoles_guild_role"}).orderBy(r.desc(r.row("exit"))).run();
    }
    return await r.table('listenedRoles').getAll([guild, role, member], {index: "listenedRoles_guild_role_member"}).orderBy(r.desc(r.row("exit"))).run();
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
    console.log(doc);
    let nameStack = [...new Set(doc.map(analytic => analytic.item))];
    if(nameStack.length !== 0) {
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