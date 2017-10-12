module.exports = (message, next, wiggle) => {
    console.log(`Bot is launched on ${wiggle.guilds.size} guilds with ${wiggle.users.size} users`);
    next();
};