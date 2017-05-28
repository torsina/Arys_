const perms = require('../config/perm/perms');
const db = require('../util/db');
module.exports = {
    help: 'get dem data',
    func: (client, msg, args, role) => {
        if(perms.check("mod.analytic.base", role, msg.author.id) !== true) {
            msg.channel.sendMessage("You don't have the permission `mod.analytic.base`");
            return;
        }
        if(args[0] === "get") { // 0 = get ; 1 = <orderby(least used; highest used; user> ; 2 = <emoji>  ;
            if (args[1] === "inc") {
                db.countAnalytic().then(doc => {
                    let array = doc.map(str => {
                        let [item, count] = str.split(" "); return { item, count }
                    });
                    //console.log(array[0].item + " " + array[0].count);
                    array.count.sort(function(a, b){return a-b});
                    console.log(array);
                    /*
                    let str = "";
                    for(let i=0;i<doc.length; i++) {
                        str += doc[i] + "\n";
                    }
                    console.log(str);*/
                });
            }
            //db.getAnalyticByName("<:feelssmugman:246765996684083210>").then(doc => {console.log(Object.keys(doc).length)})
        }
    }
};
