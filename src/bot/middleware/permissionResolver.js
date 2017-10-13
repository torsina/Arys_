const constants = require('../util/constants');
module.exports = async (message, next, wiggle) => {
    const { command } = message;
    if (!command) return next();
    const permissionNodes = constants.PERMISSION_COMMAND;

};