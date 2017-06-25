const db = module.exports = {};
let isLoaded;
let dbName = "Arys";
const r = require("rethinkdbdash")({
    host: "192.168.1.30",
    port: "28015",
    db: dbName
});
const config = require('../config/config');
db.init = async (Client) => {
    isLoaded = false;
    let dbs = await r.dbList().run();
    if(!~dbs.indexOf(dbName)) {
        console.info(`Creating database ${dbName}...`);
        await r.dbCreate(dbName).run();
    }

    let tableList = await r.tableList().run(), tableWait = [];
    let tablesExpected = [
        "setting", "post", "listenedRoles", "user", "event", "analytic",
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
        if(await entry.length === 0) {
            await db.createSetting(guild).catch(console.error);
            console.info(`Guild "${Client.guilds.get(guild).name}" was added in "setting" table`);
        }
    }
    await Promise.all(tableWait);
    console.log(`rethinkdb initialized`);
    isLoaded = true;
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
    if(!isLoaded) return;
    /*
     let query = {
     guild: guild,
     prefix: String,
     listenedRoles: Array,
     //perm: Object,
     report: Number,
     responses: Object,
     lastSave: Date.now(),
     channel: {
     log: String,
     nsfw: Array
     },
     mod: {
     purge: {
     safe: Boolean,
     value: Number
     }
     }
     };
    */
    let query = {
        guild: guild,
        enter: Date.now(),
        lastSave: Date.now()
    };
    return await r.table('setting').insert(query).run();
};

db.getSetting = async () => {
    if(!isLoaded) return;
    let doc =  await r.table('setting').run();
    let map = new Map();
    for(let subDoc of doc) {
        map.set(subDoc.guild, subDoc)
    }
    return map;
};

db.streamSetting = async () => {
    if(!isLoaded) return;
    return await r.table('setting').changes().run();
};

db.setPrefix = async (guild, prefix) => {
    if(!isLoaded) return;
    return await r.table('setting').getAll([guild], {index: "setting_guild"}).update({prefix: prefix, lastSave: Date.now()}).run();
};

db.checkPrefix = async (guild) => {
    if(!isLoaded) return;
    let guildObj = await r.table('setting').getAll([guild], {index: "setting_guild"}).run();
    if(guildObj.length === 0) return false;
    else if(guildObj.length === 1) return guildObj.first().prefix;
    else return console.error(`multiple guild found while searching for ${guild}`)
};

db.deletePrefix = async (guild) => {
    if(!isLoaded) return;
    return await r.table('setting').getAll([guild], {index: "setting_guild"}).replace(r.row.without('prefix')).run();
};
db.createPost = async (image, message, file, channel, guild) => {
    if(!isLoaded) return;
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
    if(!isLoaded) return;
    return await r.table('post').getAll([guild, file, image], {index: "post_guild_file_image"}).run();
};

db.reportPost = async (guild, message) => {
    if(!isLoaded) return;
    let a = await r.table('post').getAll([guild, message], {index: "post_guild_message"}).run();
    return await r.table('post').get(a[0].id).update({report_count: a[0].report_count+1}).run();
};

db.deletePost = async (guild, message) => {
    if(!isLoaded) return;
    return await r.table('post').getAll([guild, message], {index: "post_guild_message"}).delete().run();
};

db.createListenedRole = async (guild, role, member) => {
    if(!isLoaded) return;
    let query = {
        role: role,
        member: member,
        guild: guild,
        enter: Date.now()
    };
    return await r.table('listenedRoles').insert(query).run();
};

db.endListenedRole = async (guild, role, member) => {
    if(!isLoaded) return;
    let doc = await r.table('listenedRoles').getAll([guild, role, member], {index: "listenedRoles_guild_role_member"}).orderBy(r.row("exit")).run();
    return await r.table('listenedRoles').get(doc[0].id).update({exit: Date.now()}).run();

};

db.getListenedRole = async (guild, role, member) => {
    if(!isLoaded) return;
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
    if(!isLoaded) return;
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
    if(!isLoaded) return;
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
    if(!isLoaded) return;
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

db.fix = async () => {
    if(!isLoaded) return;
    const mongo = require('./db');
    let doc = await mongo.getAnalytic().catch(console.error);
    for(let i=0;i<doc.length;i++) {
        if(doc[i].date && doc[i].guild) {
            await db.createAnalytic(doc[i].guild, doc[i].channel, doc[i].item, doc[i].member, parseInt(doc[i].date))
        }
    }
};