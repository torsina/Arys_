const constants = require("../../util/constants");
const db = require("../util/rethink");
const { MAXCACHE } = constants;

class BetCount {
    constructor(data, Arys, exist = false) {
        this.guildID = data.guildID;
        this.count = data.count || 0;
        this.lastSave = data.lastSave || Date.now();
        // no need for the methods if we only want the data structure in itself
        if (Arys) {
            this.addCount = async (value) => {
                const { betCounts } = Arys;
                this.count = parseInt(this.count) + parseInt(value);
                if (isNaN(this.count)) this.count = 0;
                // buffer mechanism
                // wait MAXCACHE.betCountWait time before saving again to prevent database useless spam
                if (this.lastSave + MAXCACHE.betCountWait < Date.now()) {
                    this.lastSave = Date.now();
                    betCounts.set(this.guildID, this);
                    try {
                        await db.addBetCount(this.guildID, this._count, exist);
                    } catch (err) {
                        console.error(err);
                    }
                }
            };
        }
    }
}
module.exports = BetCount;