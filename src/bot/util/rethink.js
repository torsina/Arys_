const db = module.exports = {};
const config = require("../../../config");
const constants = require("../../util/constants");
const dbName = config.db.dbName || "Arys_rewrite";
const GuildSetting = require("../structures/GuildSetting");
const GuildChannel = require("../structures/GuildChannel");
const GuildRole = require("../structures/GuildRole");
const GuildMember = require("../structures/GuildMember");
const r = require("rethinkdbdash")({
    host: config.db.host,
    port: config.db.port,
    db: dbName
});

db.init = async () => {
    const expected = constants.DB_MODEL;
    const dbs = await r.dbList().run();
    // creating database if not already created
    if (dbs.indexOf(dbName) < 0) {
        console.log(`Creating database ${dbName}...`);
        await r.dbCreate(dbName).run();
    }
    const tableStart = await r.tableList().run();
    // iterate through all of the expected tables and create them if needed
    for (const table of expected) {
        if (tableStart.indexOf(table.name) < 0) {
            await r.tableCreate(table.name, { primaryKey: table.primary }).run();
            console.log(`Creating "${table.name}" table...`);
        }
        // iterate through all of the expected indexes of this table
        const indexStart = await r.table(table.name).indexList().run();
        if (table.index) {
            for (const index of table.index) {
                if (indexStart.indexOf(index.name) < 0) {
                    await r.table(table.name).indexCreate(index.name, index.rows.map((i) => r.row(i))).run().catch(console.error);
                    console.log(`Creating index of "${index.name}" in "${table.name}" table...`);
                    await r.table(table.name).indexWait(index.name).run();
                    console.log(`Index "${index.name}" in "${table.name}" table is set up`);
                }
            }
        }
    }
};
// guildSetting getter/setter
db.setGuildSetting = async (data) => {
    data = new GuildSetting(data);
    data.money = data.money._data;
    return await r.table("guild").insert(data).run();
};

db.initGuildSetting = async (client, storedGuildArray) => {
    const guildArray = Array.from(client.discordClient.guilds.keys());
    guildArray.forEach(async (guildID) => {
        // loop through the guilds to check that no one is missing from the database
        if (!storedGuildArray.get(guildID)) {
            const { name } = client.discordClient.guilds.get(guildID);
            await db.setGuildSetting({ guildID: guildID });
            console.log(`added the guild "${name}" to the database`);
        }
    });
};

db.getGuildSetting = async (guildsID) => {
    if (typeof guildID === "string") return await r.table("guild").get(guildsID).run();
    const doc = await r.table("guild").getAll(...guildsID).run();
    return new Map(doc.map((item) => [item.guildID, new GuildSetting(item)]));
};

db.editGuildSetting = async (guildID, data, force = false) => {
    data.money = data.money._data;
    if (force) return await r.table("guild").get(guildID).replace(data).run();
    return await r.table("guild").get(guildID).update(data).run();
};

db.deleteGuildSetting = async (guildID) => {
    return await r.table("guild").get(guildID).delete().run();
};

db.streamGuildSetting = async () => {
    return await r.table("guild").changes().run();
};

// guildRole getter/setter
db.setGuildRole = async (data) => {
    if (!(data instanceof GuildRole)) {
        const query = new GuildRole(data);
        return await r.table("guildRole").insert(query).run();
    } else return await r.table("guildRole").insert(data).run();
};

db.getGuildRole = async (roleID) => {
    const doc = await r.table("guildRole").get(roleID).run();
    if (doc === null) {
        const Role = new GuildRole({ roleID });
        await db.setGuildRole(Role);
        return Role;
    } else {
        return new GuildRole(doc);
    }
};

db.editGuildRole = async (roleID, data, force = false) => {
    if (force) {
        data = new GuildRole(data);
        return await r.table("guildRole").get(roleID).replace(data).run();
    }
    return await r.table("guildRole").get(roleID).update(data).run();
};

db.deleteGuildRole = async (roleID) => {
    return await r.table("guildRole").get(roleID).delete().run();
};

// guildChannel getter/setter
db.setGuildChannel = async (data) => {
    if (!(data instanceof GuildChannel)) {
        const query = new GuildChannel(data);
        return await r.table("guildChannel").insert(query).run();
    } else return await r.table("guildChannel").insert(data).run();
};

db.getGuildChannel = async (channelID) => {
    const doc = await r.table("guildChannel").get(channelID).run();
    if (doc === null) {
        const channel = new GuildChannel({ channelID });
        await db.setGuildChannel(channel);
        return channel;
    } else {
        return new GuildChannel(doc);
    }
};

db.editGuildChannel = async (channelID, data, force = false) => {
    if (force) {
        data = new GuildChannel(data);
        return await r.table("guildChannel").get(channelID).replace(data).run();
    }
    return await r.table("guildChannel").get(channelID).update(data).run();
};

db.deleteGuildChannel = async (_channelID) => {
    return await r.table("guildChannel").get(_channelID).delete().run();
};

// guildMember getter/setter

db.setGuildMember = async (data) => {
    if (!(data instanceof GuildMember)) {
        const query = new GuildMember(data);
        return await r.table("guildMember").insert(query).run();
    } else return await r.table("guildMember").insert(data).run();
};

db.getGuildMember = async (memberID, guildID) => {
    const doc = await r.table("guildMember").getAll([guildID, memberID], { index: "guildMember_guildID_memberID" }).run();
    if (doc[0] === undefined) {
        const Member = new GuildMember({ memberID, guildID });
        await db.setGuildMember(Member);
        return Member;
    } else {
        return new GuildMember(doc[0]);
    }
};

db.editGuildMember = async (data, force = false) => {
    if (!data.id) {
        throw new Error("Type error: the document is missing it's primary key");
    }
    if (force) {
        data = new GuildMember(data);
        return await r.table("guildMember").get(data.id).replace(data).run();
    }
    return await r.table("guildMember").get(data.id).update(data).run();
};

db.deleteMember = async (memberID, guildID) => {
    return await r.table("guildMember").getAll([guildID, memberID], { index: "guildMember_guildID_memberID" }).delete().run();
};

/**
 * this.member - member's bitField
 * this.roles - Array of the roles bitField
 * this.channel.own - channel's bitField
 * this.channel.overrides.members - Array of objects containing the bitField override and the id of the member
 * this.channel.overrides.roles - Array of objects containing the bitField override and the id of the role
 * @param _rolesID
 * @param _channelID
 * @param _memberID
 * @param _guildID
 * @returns {Promise.<*>}
 */
db.getBitFields = async (_rolesID, _channelID, _memberID, _guildID) => {
    const member = await db.getGuildMember(_memberID, _guildID);
    const roles = await r.table("guildRole").getAll(..._rolesID).pluck("bitField").run();
    const channel = await db.getGuildChannel(_channelID);
    return {
        member: member.bitField,
        roles: roles,
        channel: {
            own: channel.bitField,
            overrides: channel.overrides
        }
    };
};