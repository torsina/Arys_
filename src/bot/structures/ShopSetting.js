const FriendlyError = require("./FriendlyError");
const spaceRegExp = /^\s+$/;
const constants = require("../../util/constants");
const { SHOP } = constants;
class ShopSetting {
    constructor(data) {
        if (data) {
            this._data = data;
            this.roles = this._data.roles;
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
            this._data = { roles: [] };
            this.roles = this._data.roles;
            this.rolesMap = new Map();
        }
    }
    hasRole(role) {
        return this.rolesMap.has(role.id);
    }
    addRole(role, price) {
        if (this.hasRole(role)) return this.editRole(role, price);
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
    }
    editRole(role, price) {
        if (!this.hasRole(role)) return this.addRole(role, price);
        const itemMap = this.rolesMap.get(role.id);
        const item = this.roles[itemMap.index];
        itemMap.price = price;
        item.price = price;
    }
    deleteRole(role) {
        if (!this.hasRole(role)) return new FriendlyError("shop.role.delete.notFound");
        const itemMap = this.rolesMap.get(role.id);
        this.roles.splice(itemMap.index, 1);
        for (let i = itemMap.index, n = this.roles.length; i < n; i++) {
            const iteratedItem = this.roles[i];
            iteratedItem.index = i;
        }
        this.rolesMap.delete(role.id);
    }
    getRole(role) {
        return this.rolesMap.get(role.id);
    }
}

module.exports = ShopSetting;