const MoneyAccount = require("./MoneyAccount");
class GuildMember {
    constructor(data = {}, GuildSetting) {
        this.id = data.id;
        this.memberID = data.memberID;
        // for member overrides storage we don't need to store the id of the guild
        if (!data.insideGuild) {
            this.guildID = data.guildID;
            if (!this.guildID) throw new TypeError("guildID is undefined");
        }
        if (!this.memberID) throw new TypeError("memberID is undefined");
        this.bitField = data.bitField || null;
        this.money = new MoneyAccount(data.money, GuildSetting);
    }
}
module.exports = GuildMember;