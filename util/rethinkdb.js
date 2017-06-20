const db = module.exports = {};


let dbName = "Arys";
const r = require("rethinkdbdash")({
    host: "192.168.1.30",
    port: "28015",
    db: "Arys"
});

db.init = async () => {
    let dbs = await r.dbList().run();
    if(!~dbs.indexOf(dbName)) {
        console.info(`Creating database ${dbName}...`);
        await r.dbCreate(dbName).run();
    }

    let tableList = await r.tableList().run(), tableWait = [];
    let tablesExpected = [
        "settings", "post", "listenedRoles", "user", "event", "analytic",
    ];
    let indexExpected = [
        {table: "analytic", index: "guild_date", row: ["guild", "date"]},
    ];
    let indexes = [];
// create indexes and push them to indexCreate, for example indexCreates.push(r.table(...).indexCreate(...))
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
        if(!containsObject(index, indexes)) {
            if(index.row.length > 1)
                await r.table(index.table).indexCreate(index.index, [r.row(index.row[0]), r.row(index.row[1])]).run();
            else
                await r.table(index.table).indexCreate(index.index).run();
            console.info(`Creating index of "${index.index}" in "${index.table}" table...`);
            await r.table(index.table).indexWait(index.index).run();
            console.info(`Index "${index.index}" in "${index.table}" table is set up`);
        }
    }
    await Promise.all(tableWait);
    console.log(`rethinkdb initialized`);
    return true;

    /*
    let Indexes = [];
    // create indexes and push them to indexCreate, for example indexCreates.push(r.table(...).indexCreate(...))
    await Promise.all(indexCreates);
     */
};
db.init().catch(console.error);

function containsObject(obj, list) {
    for(let i = 0; i < list.length; i++) {
        if (list[i].table === obj.table ) {
            if (list[i].index === obj.index) return true;
        }
    }
    return false;
}

function date() {
    let timestamp = new Date();
    return timestamp.getFullYear() + '-' + (timestamp.getMonth() + 1) + '-' + timestamp.getDate() + ' ' + timestamp.getHours() + ':' + timestamp.getMinutes() + ":" + timestamp.getSeconds();
}

db.createPost = async (image, message, file, channel, guild) => {
    let query = {
        id_image: image,
        id_message: message,
        id_file: file,
        channel: channel,
        guild: guild,
        report_count: 0
    };
    return await r.table('post').insert(query).run();
};
//db.createPost("imadge", "messaffge", "figle", "chg", "f");
db.getPost = async (image, file, guild) => {
    let query  = {
        id_image: image,
        id_file: file,
        guild: guild
    };
    return await r.table('post').filter(query).run();
};

db.reportPost = async (guild, message) => {
    let query ={
        id_message: message,
        guild: guild
    };
    let a = await r.table('post').filter(query).run();
    console.log(a);
    return await r.table('post').get(a[0].id).update({report_count: a[0].report_count+1}).run();
};

db.deletePost = async (guild, message) => {
    let query  = {
        id_message: message,
        guild: guild
    };
    return await r.table('post').filter(query).delete().run();
};

db.createListenedRole = async (guild, role, member) => {
    let query = {
        role: role,
        id: member,
        guild: guild,
        enter: date()
    };
    return await r.table('listenedRoles').insert(query).run();
};

db.endListenedRole = async (guild, role, member) => {
    let query  = {
        role: role,
        id: member,
        guild: guild,
        exit: undefined
    };
    return await r.table('listenedRoles').filter(query).update({exit: date()}).run();
};

db.getListenedRole = async (guild, member) => {
    let query = {
        guild: guild
    };
    if(member !== undefined) query.member = member;
    return await r.table('listenedRoles').filter(query).run();
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

db.countAnalytic = async (guild, item) => {
    let query = {
        guild: guild
    };
    let stack = [];
    if(item !== undefined) query.item = item;
    let doc = await r.table('analytic').filter(query).run();
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
    let doc  = await r.table("analytic").between([guild, min], [guild, max], { index: "guild_date" }).run();
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
    const mongo = require('./db');
    let doc = await mongo.getAnalytic().catch(console.error);
    //let doc = await r.table('analytic').run();
    for(let i=0;i<doc.length;i++) {
        if(doc[i].date && doc[i].guild) {
            //console.log("trigger");
            await db.createAnalytic(doc[i].guild, doc[i].channel, doc[i].item, doc[i].member, parseInt(doc[i].date))
        }
    }
};