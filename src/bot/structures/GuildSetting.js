const MoneySetting = require("./MoneySetting");
const ShopLists = require("./ShopSetting");
const misc = require("../../util/misc");
class GuildSetting {
    constructor(data) {
        /**
         * Discord's snowflake of that guild
         * @type {Snowflake}
         */
        this.guildID = data.guildID;
        if (!this.guildID) throw new TypeError("guildID is undefined");

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
}
module.exports = GuildSetting;