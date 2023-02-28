const base = require("./shop.json");
base["shop.add.usage"] = `${base["shop.add.role.usage"]}`;
base["shop.edit.usage"] = `${base["shop.edit.role.usage"]}`;
base["shop.delete.usage"] = `${base["shop.delete.role.usage"]}`;
base["shop.buy.usage"] = `${base["shop.buy.role.usage"]}`;
base["shop.sell.usage"] = `${base["shop.sell.role.usage"]}`;
base["shop.usageWithoutEdit"] = `${base["shop.buy.usage"]}\n${base["shop.sell.usage"]}`;
base["shop.usageWithEdit"] = `${base["shop.add.usage"]}\n${base["shop.edit.usage"]}\n${base["shop.delete.usage"]}\n${base["shop.usageWithoutEdit"]}`;
module.exports = base;