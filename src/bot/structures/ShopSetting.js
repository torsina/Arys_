const FriendlyError = require("./FriendlyError");
const spaceRegExp = /^\s+$/;
const constants = require("../../util/constants");
const { SHOP } = constants;
class ShopSetting {
    constructor(data) {
        if (data) {
            this._data = data;
            this.roles = this._data.roles || [];
            this.rolesURL = this._data.rolesURL;
            this.rolesMap = new Map();
            for (let i = 0, n = this.roles.length; i < n; i++) {
                const item = this.roles[i];
                const itemMap = {
                    id: item.id,
                    price: item.price,
                    index: i
                };
                this.rolesMap.set(item.id, itemMap);
            }

        } else {
            this._data = { roles: [], rolesURL: [] };
            this.roles = this._data.roles;
            this.rolesURL = this._data.rolesURL;
            this.rolesMap = new Map();
        }
    }
    hasRole(role) {
        return this.rolesMap.has(role.id);
    }
    addRole(role, price) {
        if (this.hasRole(role)) return this.editRole(role, price);
        // delete image links since outdated
        this._data.rolesURL = [];
        const item = {
            id: role.id,
            price
        };
        const index = this.roles.length;
        this.roles.push(item);
        const itemMap = {
            id: role.id,
            price,
            index
        };
        this.rolesMap.set(role.id, itemMap);
        return "add";
    }
    editRole(role, price) {
        if (!this.hasRole(role)) return this.addRole(role, price);
        // delete image links since outdated
        this._data.rolesURL = [];
        const itemMap = this.rolesMap.get(role.id);
        const item = this.roles[itemMap.index];
        itemMap.price = price;
        item.price = price;
        return "edit";
    }
    deleteRole(role) {
        if (!this.hasRole(role)) throw new FriendlyError("shop.role.delete.notFound");
        // delete image links since outdated
        this._data.rolesURL = [];
        const itemMap = this.rolesMap.get(role.id);
        this.roles.splice(itemMap.index, 1);
        for (let i = itemMap.index, n = this.roles.length; i < n; i++) {
            const iteratedItem = this.roles[i];
            iteratedItem.index = i;
        }
        this.rolesMap.delete(role.id);
        return "delete";
    }
    getRole(role) {
        return this.rolesMap.get(role.id);
    }
}

module.exports = ShopSetting;