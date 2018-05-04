class APIRouter {
    constructor(data) {
        this.db = data.db;
        this.router = require("express").Router(); // eslint-disable-line new-cap

        this.router.get("/servers", (req, res) => {
            console.log("ping");
            const { guilds } = req.user;
            const responseArray = [];
            for (let i = 0, n = guilds.length; i < n; i++) {
                const guild = guilds[i];
                const guildID = guild.id;
                const iconID = guild.icon;
                const iconURL = `https://cdn.discordapp.com/icons/${guildID}/${iconID}.webp`;
                responseArray.push({ guildID, iconURL, guildName: guild.name });
            }
            res.json(responseArray);
            /**
             * const guilds = req.user.guilds;
             const responseArray = [];
             for (let i = 0, n = guilds.length; i < n; i++) {
                const guild = guilds[i];
                const guildID = guild.id;
                const iconID = guild.icon;
                const iconURL = `https://cdn.discordapp.com/icons/${guildID}/${iconID}.webp`;
                responseArray.push({ guildID, iconURL, guildName: guild.name });
            }
             res.json(responseArray);
             */
        });
    }
}
module.exports = APIRouter;