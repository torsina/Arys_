const config = require('../config/config');

class guildMoney {
    constructor(data) {
        data = data.money;
        /**
         * The name of the money
         * @type {string}
         */
        this.name = data.name || config.money.name;
    }
}