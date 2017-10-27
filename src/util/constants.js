/**
 * This is the setup rethink#init uses to create all of the tables and indexes of the bot's database
 * @type {[*]}
 */
exports.DB_MODEL = [
    { name: "guild", primary: "guildID" },
    { name: "guildRole", primary: "roleID" },
    { name: "guildChannel", primary: "channelID" },
    { name: "user", primary: "userID" },
    // can't use guildMember's snowflake as primary key because one user may be in 2 guilds
    { name: "guildMember", index: [
        { name: "guildMember_guildID_memberID", rows: ["guildID", "memberID"] }
    ] },
    { name: "post", index: [
        { name: "post_guildID_message", rows: ["guildID", "message"] },
        { name: "post_guildID_file_image", rows: ["guildID", "file", "image"] }
    ] },
    { name: "shopCategory", index: [
        { name: "shopCategory_guildID", rows: ["guildID"] },
        { name: "shopCategory_guildID_category", rows: ["guildID", "category"] }
    ] },
    { name: "shopItem", index: [
        { name: "shopItem_guildID_category", rows: ["guildID", "category"] },
        { name: "shopItem_guildID_category_ID", rows: ["guildID", "category", "ID"] }
    ] }
];

/**
 * @constant bitField containing all of the bot's permissions
 * due to it's use, every permission inside of it is set to 1
 * @type {object}
 */
exports.PERMISSION_BITFIELD_DEFAULT = {
    commands: {
        moderation: {},
        settings: {
            perms: 0
        },
        util: {
            ping: 3
        }
    }
};

exports.PERMISSION_BITFIELD = {
    commands: {
        moderation: {},
        settings: {
            perms: {
                visible: 1 << 0,
                allow: 1 << 1,
                deny: 1 << 2,
                show: 1 << 3,
                override: 1 << 4
            }
        },
        util: {
            ping: {
                visible: 1 << 0,
                base: 1 << 1
            }
        }
    }
};

exports.PERMISSION_NODE = {
    commands: {
        settings: {
            perms: {
                visible: "settings.perms.visible",
                allow: "settings.perms.allow",
                deny: "settings.perms.deny",
                show: "settings.perms.show",
                override: "settings.perms.override"
            }
        },
        util: {
            ping: {
                visible: "util.ping.visible",
                base: "util.ping.base"
            }
        }
    }
};

exports.IMAGE_TYPES = ["shopList"];

exports.IMAGE_SHOPLIST = {
    max: 18,
    colors: ["#32363B", "#36393E"],
    ctx: {
        font: "normal normal 24px Whitney",
        shadowColor: "black",
        shadowOffsetX: 2,
        shadowOffsetY: 2,
        shadowBlur: 0
    },
    startText: 28,
    startPrice: 674
};