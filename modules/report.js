const Arys = require('../Arys');
const post = require('./post');
const config = require('../config/config');
const db = Arys.db;
const perms = require('../config/perms');


var image = new Array();
for(var id=0; id<post.line; id++){
    image[id] = new Array();
}



module.exports = {
    help: 'Use this if some retard placed loli in my lists, usage : $report (id)',
    func: (client, msg, args, role) => {
        setTimeout(function() {
            msg.delete();
        }, config.discord.wait);
        if(perms.check("report.base", role) !== true) {
            msg.channel.sendMessage("You don't have the permission to do that");
            return;
        }
        db.serialize(function() {

            db.each("SELECT id_message, report_count FROM post WHERE id_image='"+args[0]+"'", function(err, post) { // SELECT id_image, id_message, id_file WHERE id_file="file_name" FROM post
                let report = parseInt(post.report_count) + 1;
                if(perms.check("report.force", role) === true && args[1]==='--force'){
                    msg.channel.fetchMessage(post.id_message)
                        .then(m => {
                            m.delete()
                            msg.channel.sendMessage("id : "+args[0]+" was deleted")
                        })
                        .catch(console.error);
                        return;

                }
                else if(perms.check("report.force", role) !== true && args[1]==='--force') {
                    msg.channel.sendMessage("You don't have the permission to do that");
                    return;
                }
                else if(!image[args[0]].includes(msg.author.id)){
                    image[args[0]][report-1] = msg.author.id;
                }
                else {msg.reply("you already reported this image you twat !").then(m => {
                    setTimeout(function() {
                        m.delete();
                    }, config.discord.wait);
                    });
                    return;
                }
                db.run("UPDATE post SET report_count = '"+report+"' WHERE id_image='"+args[0]+"'");
                msg.channel.sendMessage("report count : " + report).then(m => {
                    setTimeout(function() {
                        m.delete();
                    }, config.discord.wait);
                });
                msg.channel.fetchMessage(post.id_message)
                    .then(m => {
                        let edit = m.content.split("-");
                        edit[0] += "\n" + "-" + "\n" + "report count : " + report;
                        m.edit(edit[0])
                            .catch(console.error);
                    })
                    .catch(console.error);
                if(report > config.report.need){
                    msg.channel.fetchMessage(post.id_message)
                        .then(m => {
                            m.delete();
                            msg.channel.sendMessage("id : "+args[0]+" was deleted")
                        })
                        .catch(console.error);
                }
            });
        });
    }
};