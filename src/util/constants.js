// Symbol declarations
const misc = require("./misc");
Symbol.for("<");
Symbol.for(">");
const constants = module.exports = {};

/**
 * This is the setup rethink#init uses to create all of the tables and indexes of the bot's database
 * @type {[*]}
 */

constants.DB_MODEL = [
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
    { name: "betCount", primary: "guildID" },
    { name: "oauth", primary: "userID", rows: ["token"] }
];

constants.VALUEFIELD_DEFAULT = {
    nsfw: {
        post: [20, Symbol.for("<")] // smaller than
    }
};

/**
 * @constant bitField containing all of the bot's permissions
 * due to it's use, every permission inside of it is set to 1
 */
constants.PERMISSION_BITFIELD_DEFAULT = {
    moderation: {
        kick: 0,
        ban: 0,
        prune: 0
    },
    money: {
        bet: 0,
        credits: 0,
        shop: 0,
        daily: 0,
        transfer: 0
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
constants.PERMISSION_BITFIELD = {
    moderation: {
        kick: {
            visible: 1 << 0
        },
        ban: {
            visible: 1 << 0
        },
        prune: {
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
        },
        shop: {
            visible: 1 << 0,
            edit: 1 << 1,
            buy: 1 << 2,
            sell: 1 << 3
        },
        daily: {
            visible: 1 << 0,
            self: 1 << 1,
            other: 1 << 2
        },
        transfer: {
            visible: 1 << 0,
            base: 1 << 1,
            force: 1 << 2
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
constants.PERMISSION_NODE = {
    settings: {
        perms: {
            visible: "settings.perms.visible",
            set: "settings.perms.edit",
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
        },
        shop: {
            add: "money.shop.edit",
            edit: "money.shop.edit",
            remove: "money.shop.edit",
            buy: "money.shop.buy",
            sell: "money.shop.sell"
        },
        daily: {
            base: "money.daily.self"
        },
        transfer: {
            base: "money.transfer.base"
        }
    },
    util: {
        ping: {
            visible: "util.ping.visible",
            base: "util.ping.base"
        }
    }
};

constants.GUILDSETTING_DEFAULT = {
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
    moneyNameLength: 40
};

constants.IMAGE_TYPES = ["role"];

constants.IMAGE_ROLESHOP = {
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

constants.SHOP = {
    categoryOptions: ["header", "order", "name"],
    itemOptions: ["price"],
    maxPriceDigit: 8,
    maxPerPage: 18,
    maxCategoryNameLength: 40,
    role: {
        defaultHex: "#FFFFFF"
    }
};

constants.SHOP_LIST_OPTIONS = [
    "header", "url"
];

constants.GUILDMEMBER_DEFAULT = {
    money: {

    }
};

constants.MONEYACCOUNT_DEFAULT = {
    amount: 200
};

constants.MAXCACHE = {
    members: 100,
    fetchMessages: 1000,
    betCountWait: 6E5 // 10 minutes
};

constants.PERMISSION_LIST = {
    bitField: misc.iterate(constants.PERMISSION_BITFIELD),
    valueField: misc.iterate(constants.VALUEFIELD_DEFAULT)
};
