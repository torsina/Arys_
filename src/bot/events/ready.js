module.exports = (next, wiggle) => {
    console.log(`Bot is launched on ${wiggle.erisClient.guilds.size} guilds with ${wiggle.erisClient.users.size} users`);
    next();
};