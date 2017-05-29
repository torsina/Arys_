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
                    array.sort(function(a, b){
                        return a.count-b.count;
                    });
                    //msg.channel.sendMessage(array.item + " " + array.count);

                    let str = "";
                    for(let i=0;i<array.length; i++) {
                        str += array[i].item + " " + array[i].count + "\n";
                    }
                    msg.channel.sendMessage(str);
                });
            }
            //db.getAnalyticByName("<:feelssmugman:246765996684083210>").then(doc => {console.log(Object.keys(doc).length)})
        }
        if(args[0] === "delete") {
            db.deleteAnalytic();
        }
    }
};

function compare(a,b) {
    if (a.count < b.count)
        return -1;
    if (a.count > b.count)
        return 1;
    return 0;
}

