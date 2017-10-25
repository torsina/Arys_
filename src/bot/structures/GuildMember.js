class GuildMember {
    constructor(data) {
        this.memberID = data.memberID;
        this.guildID = data.guildID;
        if (!this.memberID) throw new Error("Type error: memberID is undefined");
        if (!this.guildID) throw new Error("Type error: guildID is undefined");
        this.bitField = data.bitField || {};
    }
}
module.exports = GuildMember;