class RoleOverride {
    constructor(data) {
        this.roleID = data.roleID;
        if (!this.roleID) throw new TypeError("roleID is undefined");
        this.bitField = data.bitField;
        this.valueField = data.valueField;
    }
}
module.exports = RoleOverride;