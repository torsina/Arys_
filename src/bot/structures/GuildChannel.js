class GuildChannel {
    constructor(data) {
        this.channelID = data.channelID;
        if (!this.channelID) throw new TypeError("channelID is undefined");
        this.bitField = data.bitField || null;
        if (data.overrides) {
            this.overrides = {
                members: data.overrides.members || [],
                roles: data.overrides.roles || []
            };
        } else {
            this.overrides = {
                members: [],
                roles: []
            };
        }
    }
}
module.exports = GuildChannel;