const MoneySetting = require("./MoneySetting");
const ShopLists = require("./ShopSetting");
const FriendlyError = require("./FriendlyError");
class guildSetting {
    constructor(data) {
        /**
         * Discord's snowflake of that guild
         * @type {Snowflake}
         */
        this.guildID = data.guildID;
        if (!this.guildID) throw new TypeError("guildID is undefined");
        this.prefixes = data.prefixes || [];

        if (data.permission) {
            this.permission = {
                roles: data.permission.roles || []
            };
        } else {
            this.permission = {
                roles: []
            };
        }
        this.money = new MoneySetting(data.money);
        this.shop = new ShopLists(data.shop);
    }
    addPrefix(prefix) {
        if (!this.prefixes.includes(prefix)) this.prefixes.push(prefix);
        else throw new FriendlyError("setting.prefix.alreadyExists");
    }
    deletePrefix(prefix) {
        const index = this.prefixes.indexOf(prefix);
        if (index === 0) throw new FriendlyError("setting.prefix.notExists");
    }
}
module.exports = guildSetting;
