const db = require("../../util/rethink");
const constants = require("../../../util/constants");
const { RichEmbed } = require("discord.js");
const moment = require("moment");
module.exports = {
    run: async (context) => {
        const { prefixes, guildSetting, args } = context.message;
        switch (args[0]) {
            case "add": {

        		break;
            }
            case "delete": {
                break;
            }
            default: {
                break;			}
        }
        await db.editGuildSetting(guildSetting.guildID, guildSetting, true);
    },
    argParser: async (message, args) => {
        try {
            switch (args[0]) {
                case "add":
                case "delete": {
                    args[1] = `${args[1]}`;
                    return args.slice(0, 2);
                }
                default: {
                    return [];
                }
            }
        } catch (err) {
            throw err;
        }
    },
    guildOnly: true,
    argTree: {}
};