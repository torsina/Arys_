module.exports = (next, wiggle) => {
    //wiggle.init();
    //console.log(wiggle);
    console.log(`Bot is launched on ${wiggle.erisClient.guilds.size} guilds with ${wiggle.erisClient.users.size} users`);
    next();
};