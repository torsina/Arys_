module.exports = (next, wiggle) => {
    // console.log(wiggle);
    console.log(`Bot is launched on ${wiggle.discordClient.guilds.size} guilds with ${wiggle.discordClient.users.size} users`);
    next();
};