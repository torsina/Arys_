const constants = require("../util/constants");
const db = require("../util/rethink");
class GuildSetting {
    constructor(data) {
        /**
         * Discord's snowflake of that guild
         * @type {Snowflake}
         */
        this.guildID = data.guildID;
        if(!this.guildID) throw new Error("Type error: guildID is undefined");
        /**
         * The money configuration of the guild
         * @type {object}
         */
        this.money = null;

        if (data.permission) {
            this.permission = {
                roles: data.permission.roles || []
            };
        } else {
            this.permission = {
                roles: []
            };
        }
    }
}
module.exports = GuildSetting;