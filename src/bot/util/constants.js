/**
 * This is the setup rethink#init uses to create all of the tables and indexes of the bot's database
 * @type {[*]}
 */
exports.DB_MODEL = [
    {name: "guild", primary: "guildID"},
    {name: "guildRole", primary: "roleID"},
    {name: "guildChannel", primary: "channelID"},
    {name: "user", primary: "userID"},
    // can't use guildMember's snowflake as primary key because one user may be in 2 guilds
    {name: "guildMember", index: [
        {name: "guildMember_guildID_memberID", rows: ["guildID", "memberID"]}
    ]},
    {name: "post", index: [
        {name: "post_guildID_message", rows: ["guildID", "message"]},
        {name: "post_guildID_file_image", rows: ["guildID", "file", "image"]}
    ]},
    {name: "shopCategory", index: [
        {name: "shopCategory_guildID", rows: ["guildID"]},
        {name: "shopCategory_guildID_category", rows: ["guildID", "category"]}
    ]},
    {name: "shopItem", index: [
        {name: "shopItem_guildID_category", rows: ["guildID", "category"]},
        {name: "shopItem_guildID_category_ID", rows: ["guildID", "category", "ID"]}
    ]}
];

/**
 * @constant bitField containing all of the bot's permissions
 * due to it's use, every permission inside of it is set to 1
 * @type {object}
 */
exports.PERMISSION_BITFIELD_DEFAULT = {
    commands: {
        moderation: {},
        settings: {},
        util: {
            ping: 0
        }
    }
};

exports.PERMISSION_BITFIELD = {
    commands: {
        moderation: {},
        settings: {},
        util: {
            ping: {
                visible: 1 << 0,
                base: 1 << 1
            }
        }
    }
};

exports.PERMISSION_COMMAND = {
    commands: {
        util: {
            ping: {
                visible: "util.ping.visible",
                base: "util.ping.base"
            }
        }
    }
};