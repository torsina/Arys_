module.exports = {
    run: async ({ message, t }) => {
        message.channel.send(t("ping.success", {
            ms: Math.floor(message.client.ping)
        }));
        console.log(message.betCount);
    },
    args: [
        {
            type: "text",
            label: "word",
            optional: true
        }]
};