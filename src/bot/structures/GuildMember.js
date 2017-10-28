class GuildMember {
    constructor(data = {}) {
        this.id = data.id;
        this.memberID = data.memberID;
        // for member overrides storage we don't need to store the id of the guild
        if (!data.insideGuild) {
            this.guildID = data.guildID;
            if (!this.guildID) throw new Error("Type error: guildID is undefined");
        }
        if (!this.memberID) throw new Error("Type error: memberID is undefined");
        this.bitField = data.bitField || null;
    }
}
module.exports = GuildMember;