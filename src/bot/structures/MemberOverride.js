class MemberOverride {
    constructor(data) {
        this.memberID = data.memberID;
        if (!this.memberID) throw new TypeError("memberID is undefined");
        this.bitField = data.bitField;
        this.valueField = data.valueField;
    }
}
module.exports = MemberOverride;