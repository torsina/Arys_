const db = require("../../util/rethink");
const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        const { GuildSetting, GuildMember, GuildMemberMap } = context.message;
        const { shop } = GuildSetting;
        switch (context.args[0]) {
            case "add": {
                switch (context.args[1]) {
                    case "category": {
                        switch (context.args[2]) {
                            case "role": {

                            }
                        }
                    }
                }
            }
        }
        // shop add <type(role/permission)> <categoryName> <item>
    },
    guildOnly: true,
    flags: [{
        name: "header",
        type: "role",
        short: "h"
    }],
    argTree: {
        type: "text",
        next: {
            VALUE: {
                type: "text",
                last: true
            },
            add: {
                type: "text",
                max: 40,
                next: {
                    category: {
                        type: "text",
                        next: {
                            role: {
                                type: "text",
                                next: {
                                    VALUE: {
                                        type: "text",
                                        last: true
                                    }
                                }
                            }
                        }
                    },
                    role: {
                        type: "text",
                        label: "category",
                        next: {
                            VALUE: {
                                type: "role",
                                label: "role name"
                            }
                        }
                    }
                }
            },
            accounts: {
                type: "text",
                next: {
                    amount: {
                        type: "int"
                    }
                }
            }
        }
    }
};

