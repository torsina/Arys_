const bitField = require("../../bot/util/BitField");
const uuid = require("uuid/v4");
class APIRouter {
    constructor(data) {
        this.db = data.db;
        this.ws = data.ws;
        this.router = require("express").Router(); // eslint-disable-line new-cap

        this.router.get("/servers", (req, res) => {
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
        });
        this.router.get("/servers/:server", (req, res) => {
            const guildID = req.params.server;
            const UUID = uuid();
            const sentMessage = {
                UUID,
                request: "context",
                guildID,
                memberID: req.user.id
            };
            const event = () => {
                this.ws.once("message", (message) => {
                    if (message.UUID !== UUID) return event();
                    const { permissionFields, isOwner } = message;
                    const access = {
                        permEdit: bitField.checkBuilt("settings.perms.edit", permissionFields, isOwner),
                        currencyEdit: bitField.checkBuilt("settings.currency.edit", permissionFields, isOwner),
                        shopEdit: bitField.checkBuilt("money.shop.edit", permissionFields, isOwner)
                    };
                });
            };
            this.ws.send(sentMessage);
        });
    }
}
module.exports = APIRouter;