const hexRegExp = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i;
const constants = require("../../util/constants");
const { SHOP } = constants;
class ShopLists {
    constructor(data) {
        this.shopLists = [];
        if (data) {
            const shopListArray = Object.keys(data);
            for (let i = 0, n = shopListArray.length; i < n; i++) {
                const shopList = data[shopListArray[i]];
                // to prevent from iterating over things we don't want
                if (typeof shopList === "object") {
                    if (typeof shopList.name !== "string") throw new TypeError(`${shopList.name} is not a string`);
                    if (shopList.type === "role") {
                        for (let j = 0, m = shopList.list.length; j < m; j++) {
                            const item = shopList.list[i];
                            if (typeof item !== "object") throw new TypeError("item is not a object");
                            if (!hexRegExp.test(item.hex)) throw new Error(`${item.hex} is not a valid hex color`);
                        }
                    }
                }
                this.shopLists.push(shopList);
            }
        }
    }
    // name and type are already sanitized by arg handler
    // but we need to sanitize the options of the shop list
    addList(type, name, options = {}) {
        const index = this.list.findIndex((item) => item.name === name);
        if (index) throw new Error("shop.category.alreadyExist");
        const sanitizedOptions = sanitizeOptions(options);
        const shopList = {
            type,
            name,
            options: sanitizedOptions,
            items: []
        };
        this.shopLists.push(shopList);
    }
    editList(name, options = {}) {
        const index = this.shopLists.findIndex((item) => item.name === name);
        if (index === -1) throw new Error("shop.category.noExist");
        const item = this.shopLists[index];
        return applyOptions(options, item);
    }
    deleteList(name) {
        const index = this.shopLists.findIndex((item) => item.name === name);
        if (index === -1) throw new Error("shop.category.noExist");
        this.list.splice(index, 1);
    }
    addItem(categoryName, options = {}) {
        const index = this.shopLists.findIndex((item) => item.name === categoryName);
        if (index === -1) throw new Error("shop.category.noExist");
        const category = this.shopLists[index];
        switch (category.type) {
            case "role": {
                if (!options.id) throw new Error("shop.item.noID");
                if (!options.hex) options.hex = SHOP.role.defaultHex;
                if (options.price.toString().length > SHOP.maxPriceDigit) throw new Error("shop.item.highPrice");
                const item = {
                    id: options.id,
                    hex: options.hex,
                    price: options.price
                };
                category.items.push(item);
            }
        }
    }
    editItem(categoryName, options = {}) {
        const categoryIndex = this.shopLists.findIndex((item) => item.name === categoryName);
        if (categoryIndex === -1) throw new Error("shop.category.noExist");
        const category = this.shopLists[categoryIndex];
        const itemIndex = category.items.findIndex((_item) => _item.name === options.name);
        if (itemIndex === -1) throw new Error("shop.item.noExist");
        const item = category.items[itemIndex];
        return applyOptions(options, item);
    }
    deleteItem(categoryName, id) {
        const categoryIndex = this.shopLists.findIndex((item) => item.name === categoryName);
        if (categoryIndex === -1) throw new Error("shop.category.noExist");
        const category = this.shopLists[categoryIndex];
        const itemIndex = category.items.findIndex((_item) => _item.id === id);
        if (itemIndex === -1) throw new Error("shop.item.noExist");
        category.items.splice(itemIndex, 1);
    }
}

function applyOptions(options, item) {
    const sanitizedOptions = sanitizeOptions(options);
    const keys = Object.keys(sanitizedOptions);
    for (let i = 0, n = keys.length; i < n; i++) {
        const option = keys[i];
        item[option] = sanitizedOptions[option];
    }
    return item;
}

function sanitizeOptions(options) {
    const sanitizedOptions = {};
    const optionsArray = Object.keys(options);
    for (let i = 0, n = optionsArray.length; i < n; i++) {
        const item = options[optionsArray[i]];
        const itemIndex = SHOP.listOptions.indexOf(item);
        if (itemIndex !== -1) sanitizedOptions[optionsArray[i]] = options[optionsArray[i]];
    }
    return sanitizedOptions;
}
module.exports = ShopLists;