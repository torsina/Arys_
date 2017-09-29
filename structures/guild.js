/**
 * Represents a guild from discord
 * It contains all the bot's informations about the guild
 */
class guild {
    constructor(data) {
        /**
         * The discord's snowflake ID of the guild
         * @type {String}
         */
        this.id = data.guild;

        /**
         * The timestamp the bot joined the guild at
         * @type {Number}
         */
        this.joinedTimestamp = data.enter;

        /**
         * The custom prefix that was set to this guild
         * @type {String}
         */
        if (data.prefix) {
            this.prefix = data.prefix;
        }

        if (data.money) {
            if (data.money.name) this.money
        }
    }
}