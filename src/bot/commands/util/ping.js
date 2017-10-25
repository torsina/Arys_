module.exports = {
    run: async ({ message, reply, t }) => {
        return t("ping.success", {
            ms: Math.floor(message.client.ping)
        });
    },
    args: [
        {
            type: "text",
            label: "word",
            optional: true
        }]
};