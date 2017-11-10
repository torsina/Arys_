const { RichEmbed } = require("discord.js");
module.exports = {
    run: async (context) => {
        const { flags, constants } = context;
        const options = {};
        const endMessages = [];
        options.limit = context.args[0];
        let counter = options.limit;
        if (flags.user) options.user = flags.user;
        if (flags.before) options.before = flags.before;
        if (flags.after) options.after = flags.after;
        if (flags.content) options.content = flags.content;
        let messages = await context.channel.fetchMessages(options).catch(console.error);
        messages.forEach(item => console.log(item.content));
        if (options.content) {
            while (messages.size < options.limit && counter < constants.MAXCACHE.fetchMessages) {
                messages = messages.filter(message => message.content.includes(options.content));
                endMessages.push(...messages);
                const lastMessage = messages[messages.length - 1];
                options.limit = 100;
                options.before = lastMessage.id;
                counter += 100;
                messages = await context.channel.fetchMessages(options).catch(console.error);
            }
        } else {
            endMessages.push(...messages);
        }
        context.channel.bulkDelete(endMessages, true);
        const embed = new RichEmbed()
            .setFooter(context.t("wiggle.embed.footer", { tag: context.author.tag }))
            .setTimestamp()
            .setColor("GREEN")
            .setDescription()
    },
    // TODO: create a "message" resolver in discord.js-wiggle
    flags: [
        {
            name: "user",
            short: "u",
            type: "member"
        }, {
            name: "before",
            short: "b",
            type: "text"
        }, {
            name: "after",
            short: "a",
            type: "text"
        }, {
            name: "content",
            short: "c",
            type: "text"
        }
    ],
    args: [
        {
            type: "int",
            label: "deleted messages",
            min: 0,
            max: 100,
            optional: false
        }]
};