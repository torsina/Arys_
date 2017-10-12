const BitField = require('../util/BitField');
module.exports.run = async (message, next, wiggle) => {
    console.log("I am here too" + message);
    console.log("I am here too" + wiggle);
    console.log("I am here too" + next);
    next();
};