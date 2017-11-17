module.exports = {
    run: async ({ message, t }) => {
        message.channel.send(t("ping.success", {
            ms: Math.floor(message.client.ping)
        }));
    },
    args: [
        {
            type: "text",
            label: "word",
            optional: true
        }]
};