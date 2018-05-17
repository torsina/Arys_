const db = module.exports = {};
const config = require("../../../config");
const constants = require("../../util/constants");
const misc = require("../../util/misc");
const dbName = config.db.dbName || "Arys_rewrite";
const GuildSetting = require("../structures/GuildSetting");
const GuildChannel = require("../structures/GuildChannel");
const GuildRole = require("../structures/GuildRole");
const GuildMember = require("../structures/GuildMember");
const BetCount = require("../structures/BetCount");
const util = require('util');
config.db.db = config.db.dbName;
const r = require("rethinkdbdash")(config.db);

db.r = r;

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
    // return the object containing all of the necessary db streams for the bot shard
    const streamObject = {};
    streamObject.settingStream = await db.streamGuildSetting();
    streamObject.memberStream = await db.streamGuildMember();
    return streamObject;
};
// guildSetting getter/setter
db.setGuildSetting = async (data) => {
    if (!(data instanceof GuildSetting))data = new GuildSetting(data);
    const query = {
        guildID: data.guildID,
        permission: data.permission,
        money: data.money._data,
        shop: data.shop
    };
    return await r.table("guild").insert(query).run();
};

db.initGuildSetting = async (client, storedGuildArray) => {
    const guildArray = Array.from(client.discordClient.guilds.keys());
    for (let i = 0, n = guildArray.length; i < n; i++) {
        const guildID = guildArray[i];
        // loop through the guilds to check that no one is missing from the database
        if (!storedGuildArray.get(guildID)) {
            const { name } = client.discordClient.guilds.get(guildID);
            await db.setGuildSetting({ guildID: guildID });
            console.log(`added the guild "${name}" to the database`);
        }
    }
};

db.getGuildSetting = async (guildsID) => {
    if (typeof guildID === "string") return await r.table("guild").get(guildsID).run();
    const doc = await r.table("guild").getAll(...guildsID).run();
    return new Map(doc.map((item) => [item.guildID, new GuildSetting(item)]));
};

db.editGuildSetting = async (guildID, data, force = false) => {
    if (!(data instanceof GuildSetting))data = new GuildSetting(data);
    const query = {
        guildID: data.guildID,
        permission: data.permission,
        money: data.money._data,
        shop: data.shop
    };
    if (force) return await r.table("guild").get(guildID).replace(query).run();
    return await r.table("guild").get(guildID).update(query).run();
};

db.deleteGuildSetting = async (guildID) => {
    return await r.table("guild").get(guildID).delete().run();
};

db.streamGuildSetting = async () => {
    return await r.table("guild").changes().run();
};

// betCount getter/setter
db.createBetCount = async (guildID) => {
    return await r.table("betCount").insert(new BetCount({ guildID }), { returnChanges: true }).run();
};

db.addBetCount = async (guildID, count, exist = true) => {
    if (exist) return await r.table("betCount").get(guildID).update({ count }).run();
    else return await db.createBetCount(guildID, count);
};

db.getBetCount = async (guildsID) => {
    return await r.table("betCount").getAll(...guildsID).run();
};


db.deleteBetCount = async (guildID) => {
    return await r.table("betCount").get(guildID).delete().run();
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
        const role = new GuildRole({ roleID });
        await db.setGuildRole(role);
        return role;
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
    if (!(data instanceof GuildChannel)) data = new GuildChannel(data);
    return await r.table("guildChannel").insert(data).run();
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
    if (!(data instanceof GuildMember)) data = new GuildMember(data);
    const guildSettingSave = data.money._deleteGuildSetting();
    await r.table("guildMember").insert(data).run();
    data.money._reloadGuildSetting(guildSettingSave);
};

db.getGuildMember = async (memberID, guildID, guildSetting) => {
    if (!guildSetting) throw new Error("No guildSetting provided");
    const doc = await r.table("guildMember").getAll([guildID, memberID], { index: "guildMember_guildID_memberID" }).run();
    if (doc[0] === undefined) {
        const Member = new GuildMember({ memberID, guildID }, guildSetting);
        await db.setGuildMember(Member);
        return Member;
    } else {
        return new GuildMember(doc[0], guildSetting);
    }
};

db.editGuildMember = async (data, force = false) => {
    if (!(data instanceof GuildMember)) data = new GuildMember(data);
    if (!data.id) {
        await db.setGuildMember(data);
        return;
    }
    const guildSettingSave = data.money._deleteGuildSetting();
    if (force) {
        await r.table("guildMember").get(data.id).replace(data).run();
    } else {
        await r.table("guildMember").get(data.id).update(data).run();
    }
    data.money._reloadGuildSetting(guildSettingSave);
};

db.streamGuildMember = async () => {
    return await r.table("guildMember").changes().run();
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
db.getBitFields = async (IDs, guildSetting) => {
    const { rolesID = [], rolesOverridesID = [], channelID = "", memberID = "", guildID = "" } = IDs;
    const memberData = await db.getGuildMember(memberID, guildID, guildSetting);
    const rolesData = await r.table("guildRole").getAll(...rolesID).pluck("bitField", "valueField").run();
    const channelData = await db.getGuildChannel(channelID);
    const endBitField = [];
    const endValueField = [];
    // @everyone + packed roles -> member -> channel -> channel override (packed roles) -> channel override (member)
    // get the roles
    if (rolesData) {
        for (let i = 0, n = rolesData.length; i < n; i++) {
            const role = rolesData[i];
            //console.log(`roleData: ${role}`);
            endBitField.push(role.bitField);
            endValueField.push(role.valueField);
        }
    }
    if (memberData) {
        //console.log(`memberData: ${util.inspect(memberData, false, null)}`);
        if (memberData.bitField) endBitField.push(memberData.bitField);
        if (memberData.valueField) endValueField.push(memberData.valueField);
    }
    if (channelData) {
        //console.log(`channelData: ${util.inspect(channelData, false, null)}`);
        if (channelData.bitField) endBitField.push(channelData.bitField);
        if (channelData.valueField) endValueField.push(channelData.valueField);

        // get the roles overrides
        for (let i = 0, n = channelData.overrides.roles.length; i < n; i++) {
            const override = channelData.overrides.roles[i];
            //console.log(`channel role override: ${util.inspect(override, false, null)}`);
            if (rolesOverridesID.indexOf(override.roleID) !== -1) {
                endBitField.push(override.bitField);
                endValueField.push(override.valueField);
            }
        }
        // get the member override
        const channelMemberOverrideIndex = channelData.overrides.members.findIndex(member => member.memberID === memberID);
        if (channelMemberOverrideIndex !== -1) {
            const override = channelData.overrides.members[channelMemberOverrideIndex];
            //console.log(`channel member override: ${util.inspect(override, false, null)}`);
            endBitField.push(override.bitField);
            endValueField.push(override.valueField);
        }
    }
    return {
        bitField: endBitField,
        valueField: endValueField
    };
};