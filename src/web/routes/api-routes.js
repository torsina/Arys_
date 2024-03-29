const bitField = require("../../bot/util/BitField");
const uuid = require("uuid/v4");
class APIRouter {
    constructor(data) {
        this.db = data.db; // accès de la base de donnée
        this.ws = data.ws;
        this.router = require("express").Router(); // eslint-disable-line new-cap

        this.router.get("/servers", (req, res) => {
            const { guilds } = req.user; //la ou sont gardées les données de l'utilisateur
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
        // appeler les donnée pour la liste des serveurs
        this.router.get("/servers/:server", async (req, res) => {
            const guildID = req.params.server;
            let guild;
            const UUID = uuid();
            const sentMessage = {
                UUID,
                request: "context",
                guildID,
                memberID: req.user.id
            };
            const { guilds } = req.session.passport.user;
            for (let i = 0, n = guilds.length; i < n; i++) {
                if (guilds[i].id === guildID) {
                    guild = guilds[i];
                    break;
                }
                if (i === n - 1) {
                    return res.status(401).send("guild is not in user scope");
                }
            }
            const event = () => {
                return new Promise((resolve, reject) => {
                    try {
                        setTimeout(() => {
                            reject({
                                error: 401,
                                reason: "guild is not in bot scope"
                            });
                        }, 5000);
                        this.ws.once("message", (message) => {
                            message = JSON.parse(message);
                            if (message.UUID !== UUID) return event();
                            const { permissionFields, isOwner } = message;
                            // rajouter guild name

                            const response = {
                                guildID,
                                guildName: guild.name,
                                iconURL: `https://cdn.discordapp.com/icons/${guildID}/${guild.icon}.webp`,
                                access: {
                                    permEdit: bitField.checkBuilt("settings.perms.edit", permissionFields, isOwner),
                                    currencyEdit: bitField.checkBuilt("settings.currency.edit", permissionFields, isOwner),
                                    shopEdit: bitField.checkBuilt("money.shop.edit", permissionFields, isOwner)
                                }
                            };

                            resolve(response);
                        });
                    } catch (err) {
                        reject(err);
                    }
                })
            };
            this.ws.send(JSON.stringify(sentMessage));
            event().then((result) => res.json(result)).catch((err) => res.status(err.error).send(err.reason));
        }); // fonction qui est executée quand la route est appellée
    }
}
module.exports = APIRouter; // pour qu'on importe une donnée en node.js