const fs = require('fs');
const Arys = require('../Arys');
const config = require('../config/config');
const perms = require('../util/perm');
const db = require('../util/rethinkdb');
const line = fs.readFileSync(config.post.file + '.txt').toString().split("\n");

function save(value) {
    fs.writeFile("save.txt", value, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
}

function load() {
    return parseInt(fs.readFileSync('save.txt').toString());
}

const bitField = {
    help: 1 << 0,
    base: 1 << 1,
    bypass_channel: 1 << 2,
    bypass_number: 1 << 3,
};

module.exports = {
    help: 'usage: $post (number of image, the number cant be more than 5 for obvious reasons)',
    func: async(client, msg, args, guildMember) => {
    if(config.env === "dev") return;
        try{await perms.check(guildMember, msg.channel.id, "post.base")}catch(e) {return msg.channel.send(e.message)}
        if(msg.channel.id==='275280722531581952' || role === "bot_owner"){
            if (args.length < 1){
                msg.reply("please add the number of image you want (._. )").then(m => {
                    setTimeout(function() {
                        m.delete();
                    }, config.discord.wait+2000);
                });
                return;
            }
            if (args[0] > config.post.safe && await perms.check(guildMember, msg.channel.id, "post.bypass.number") !== true){ //
                msg.reply("don't make me use all of my material you horny fuck !"+"\n" + "Go fap to your girlfriend, Oh wait..").then(m => {
                    setTimeout(function() {
                        m.delete();
                    }, config.discord.wait);
                });
                return;
            }
            let start = load();
            let end = parseInt(args[0]) + start;

            for (let i = start; i < end; i++) {
                msg.channel.send('id : ' + i + "\n" + line[i]).then(m => {
                    db.createPost(start, m.id, config.post.file, m.channel.id, m.guild.id);
                });

                console.log(start + " " + end + " " + i);
            }
            save(end);
        }
        else{
            msg.reply("why do you use me outside of the NSFW channels you stupid perverted faggot, go back to the shithole you crawled out of before I stab your eyes out with a red-hot spoon!");
        }
    }
};
module.exports.line = line.length;
module.exports.bitField = bitField;