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
// assign the permission nodes to a permission bit
exports.PERMISSION_BITFIELD = {
    commands: {
        moderation: {},
        settings: {
            perms: {
                visible: 1 << 0,
                edit: 1 << 1,
                show: 1 << 2
            },
            currency: {
                visible: 1 << 0,
                edit: 1 << 1,
                show: 1 << 2
            }
        },
        money: {
            bet: {
                visible: 1 << 0,
                base: 1 << 1
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
// assign the arguments to a permission node
exports.PERMISSION_NODE = {
    commands: {
        settings: {
            perms: {
                visible: "settings.perms.visible",
                allow: "settings.perms.edit",
                deny: "settings.perms.edit",
                show: "settings.perms.show"
            },
            currency: {
                show: "settings.currency.show",
                name: "settings.currency.edit",
                bet: "settings.currency.edit",
                daily: "settings.currency.edit",
                activity: "settings.currency.edit"
            }
        },
        money: {
            bet: {
                h: "money.bet.base",
                head: "money.bet.base",
                t: "money.bet.base",
                tail: "money.bet.base"
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

exports.GUILDSETTING_DEFAULT = {
    money: {
        name: "credits",
        accounts: {
            amount: 200
        },
        bet: {
            multiplier: 0.98,
            min: 100,
            max: null,
            used: 0
        },
        daily: {
            amount: 250,
            bonusRange: {
                min: 0,
                max: 100
            }
        },
        activity: {
            wait: 120000,
            min: 10,
            max: 30
        }
    },
    moneyNameLength: 40,
    shopCategoryNameLength: 40
};

exports.IMAGE_TYPES = ["roleShop"];

exports.IMAGE_ROLESHOP = {
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

exports.SHOP = {
    listOptions: ["header"],
    maxPriceDigit: 8,
    role: {
        defaultHex: "#FFFFFF"
    }
};

exports.SHOPLISTOPTIONS = [
    "header"
];

exports.GUILDMEMBER_DEFAULT = {
    money: {

    }
};

exports.MONEYACCOUNT_DEFAULT = {
    amount: 200
};

exports.MAXCACHE = {
    members: 100
};