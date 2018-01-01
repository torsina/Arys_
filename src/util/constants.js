// Symbol declarations
Symbol.for("<");
Symbol.for(">");

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
    { name: "betCount", primary: "guildID" }
];

exports.VALUEFIELD_DEFAULT = {
    nsfw: {
        post: [20, Symbol.for("<")]
    }
};

/**
 * @constant bitField containing all of the bot's permissions
 * due to it's use, every permission inside of it is set to 1
 */
exports.PERMISSION_BITFIELD_DEFAULT = {
    money: {
        bet: 0,
        credits: 0,
        shop: 0
    },
    nsfw: {
        hentai: 0
    },
    settings: {
        perms: 0,
        currency: 0
    },
    util: {
        ping: 0
    }
};
// assign the permission nodes to a permission bit
exports.PERMISSION_BITFIELD = {
    moderation: {
        kick: {
            visible: 1 << 0
        },
        ban: {
            visible: 1 << 0
        }
    },
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
        },
        credits: {
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
};
// assign the arguments to a permission node
exports.PERMISSION_NODE = {
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
        },
        credits: {
            base: "money.credits.base"
        }
    },
    util: {
        ping: {
            visible: "util.ping.visible",
            base: "util.ping.base"
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
};

exports.IMAGE_TYPES = ["role"];

exports.IMAGE_ROLESHOP = {
    //colors: ["#4d5059", "#2f3136"],
    colors: ["#23272a", "#2c2f33"],
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
    categoryOptions: ["header", "order", "name"],
    itemOptions: ["price"],
    maxPriceDigit: 8,
    maxPerPage: 18,
    maxCategoryNameLength: 40,
    role: {
        defaultHex: "#FFFFFF"
    }
};

exports.SHOP_LIST_OPTIONS = [
    "header", "url"
];

exports.GUILDMEMBER_DEFAULT = {
    money: {

    }
};

exports.MONEYACCOUNT_DEFAULT = {
    amount: 200
};

exports.MAXCACHE = {
    members: 100,
    fetchMessages: 400,
    betCountWait: 6E5 // 10 minutes
};