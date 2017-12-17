class GuildRole {
    constructor(data) {
        // the roleID is the primary key of the document
        this.roleID = data.roleID;
        if (!this.roleID) throw new TypeError("roleID is undefined");
        this.bitField = data.bitField || {};
        this.valueField = data.valueField || {};
    }
}
module.exports = GuildRole;