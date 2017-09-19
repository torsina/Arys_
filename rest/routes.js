const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 8080;
const router = express.Router();
const Discord = require('discord.js');
const Client = new Discord.Client();
const config = require('../config/config');
const db = require('../util/rethinkdb');
Client.login(config.discord.token.bot).catch(console.error);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//called everytime a request is made, use to check token
router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

app.use('/api', router);

router.route('/')

// create a bear (accessed at POST http://localhost:8080/api/bears)
    .post(function(req, res) {
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        let data = {};
        let guildID = req.body.guildID;
        console.log(req.body);
        console.log(req.body.guildID);
        console.log(guildID);
        console.log(typeof guildID);
        data.guildName = Client.guilds.get(guildID).name;
        data.guildImgURL = Client.guilds.get(guildID).iconURL;
        data.guildMembersCount = Client.guilds.get(guildID).memberCount;
        res.json(data);
    });

app.listen(port);
console.log("Listening for rest API on " + port);