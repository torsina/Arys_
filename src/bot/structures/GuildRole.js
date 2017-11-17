class GuildRole {
    constructor(data) {
        this.roleID = data.roleID;
        if (!this.roleID) throw new TypeError("roleID is undefined");
        this.bitField = data.bitField || null;
    }
}
module.exports = GuildRole;