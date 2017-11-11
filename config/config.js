const token = require('../token');
//if(token.env === "dev") token.bot = token.dev;
module.exports = {
    discord: {
        token: {
            bot: token.bot,
            dummy: token.dummy,
            main: token.main
        },
        prefix: "$",
        wait: 5000,
        owner: "306418399242747906"
    },
    db: {
        file: "Arys.db",
        host: "localhost",
        port: "28015"
    },
    purge: {
        safe: 20,
        max: 100
    },
    post: {
        safe: 5,
        file: "hentai"
    },
    report: {
        need: 3
    },
    money: {
        amount: 200,
        name: "credits",
        wait: 120000,
        maxCharName: 40,
        maxInt: 32768,
        daily: {
            amount: 250,
            range: {
                min: 0,
                max: 100
            }
        },
        range: {
            min: 10,
            max: 30
        },
        shop: {
            type: ["role"],
            max: 18
        },
        bet: {
            multiplier: 0.98
        }
    },
    bug: token.bug,
    //303114882147024896
    reposter: "303114882147024896", //245501778018304001
    env: token.env

};
