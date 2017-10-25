class GuildChannel {
    constructor(data) {
        //console.log(data);
        this.channelID = data.channelID;
        if (!this.channelID) throw new Error("Type error: channelID is undefined");
        this.bitField = data.bitField || {};
        if (data.overrides) {
            this.overrides = {
                members: data.overrides.members || [],
                roles: data.overrides.members || []
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