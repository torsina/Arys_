const MoneyAccount = require("./MoneyAccount");
class GuildMember {
    constructor(data = {}, guildSetting) {
        // id of the document
        this.id = data.id;
        this.memberID = data.memberID;
        this.guildID = data.guildID;
        if (!this.guildID) throw new TypeError("guildID is undefined");
        if (!this.memberID) throw new TypeError("memberID is undefined");
        this.bitField = data.bitField || {};
        this.valueField = data.valueField || {};
        this.money = new MoneyAccount(data.money, guildSetting);
    }
}
module.exports = GuildMember;