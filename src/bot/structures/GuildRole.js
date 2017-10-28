class GuildRole {
    constructor(data) {
        this.roleID = data.roleID;
        if (!this.roleID) throw new Error("Type error: roleID is undefined");
        this.bitField = data.bitField || null;
    }
}
module.exports = GuildRole;