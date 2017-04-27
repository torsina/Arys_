const fs = require('fs');
module.exports.JSON = {
    userPerm: JSON.parse(fs.readFileSync('./config/perm/JSON/users.json', 'utf8'))
};