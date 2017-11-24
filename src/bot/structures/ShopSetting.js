const FriendlyError = require("./FriendlyError");
const spaceRegExp = /^\s+$/;
const constants = require("../../util/constants");
const { SHOP } = constants;
class ShopSetting {
    constructor(data) {
        if (data) {
            this.shopArray = data.shopArray;
        } else {
            this.shopArray = [];
        }
    }
    // name and type are already sanitized by arg handler
    // but we need to sanitize the options of the shop list
    /**
     * A index of {@link ShopCategory#items} or a item id from {@link ShopCategory#items}
     * @typedef {string|number} ShopCategoryResolvable
     */

    /**
     * A index of ShopSetting#shopArray or a category name from ShopSetting#shopArray
     * @typedef {(number|string)} ShopItemResolvable
     */

    /**
     * The type of a shop category
     * * Can be one of the following
     * ```
     * [
     *   'role'
     * ]
     * ```
     * or a index from ShopSetting#shopArray
     * @typedef {number|string} ShopCategoryType
     */

    /**
     * @typedef (object) ShopCategoryOptions
     * @property (string) [header=undefined] A custom text to use when displaying all of the categories
     */

    /**
     * @typedef {object} ShopCategory
     * @property {string} name Name of the {@link ShopCategory}
     * @property {ShopCategoryType} type
     * @property {ShopCategoryOptions} options
     * @property {ShopItem[]} items
     * @property {string[]} url The urls of the rendered images from Discord's CDN
     */

    /**
     * The id of a {@link ShopItem} inside of a {@link ShopCategory}
     * Can be a {@link Snowflake}
     * @typedef {string} ShopItemId
     */

    /**
     * @typedef {object} ShopItem
     * @property {number} price The price of the {@link ShopItem}
     * @property {ShopItemId} id The id of the item
     */

    /**
     *
     * @param {string} categoryName The name of the {@link ShopCategory} to resolve.
     * @returns {{category: ShopCategory, index: ShopCategoryResolvable}}
     */
    resolveCategory(categoryName) {
        const index = this.shopArray.findIndex((item) => item.name === categoryName);
        if (index === -1) throw new FriendlyError("shop.category.noExist");
        return { category: this.shopArray[index], index };
    }
    /**
     * @param {ShopCategoryResolvable} input
     * @param {boolean} mustExist Whether the {@link ShopCategory} should exist or not.
     * @returns {{category: ShopCategory, index: ShopCategoryResolvable}}
     */
    checkCategory(input, mustExist) {
        let category, index;
        if (typeof mustExist !== "boolean") throw new TypeError(`${mustExist} is not a boolean`);
        if (typeof input === "number") {
            category = this.shopArray[input];
            index = input;
        } else {
            const findIndex = this.shopArray.findIndex((findItem) => findItem.name === input);
            if (mustExist && findIndex === -1) throw new FriendlyError("shop.category.noExist");
            else if (!mustExist && findIndex !== -1) throw new FriendlyError("shop.category.alreadyExist");
            category = this.shopArray[findIndex];
            index = findIndex;
        }
        return { category, index };
    }

    /**
     *
     * @param {ShopCategory} category
     * @param {ShopItemResolvable} input
     * @param {boolean} mustExist Whether the {@link ShopItem} should exist or not.
     * @returns {{item: ShopItem, index: ShopItemResolvable}}
     */
    checkItem(category, input, mustExist) {
        if (typeof mustExist !== "boolean") throw new TypeError(`${mustExist} is not a boolean`);
        let item, index;
        if (typeof input === "number") {
            item = category.items[input];
            index = input;
        } else {
            const findIndex = category.items.findIndex((_item) => _item.id === input);
            if (mustExist && findIndex === -1) throw new FriendlyError("shop.item.noExist");
            else if (!mustExist && findIndex !== -1) throw new FriendlyError("shop.item.alreadyExist");
            item = category.items[findIndex];
            index = findIndex;
        }
        return { item, index };
    }
    addCategory(type, name, options = {}) {
        try {
            this.checkCategory(name, false);
        } catch (err) {
            throw err;
        }
        const sanitizedOptions = sanitizeOptions(options);
        if (spaceRegExp.test(name)) throw new FriendlyError("shop.category.noSpace");
        if (name.length > SHOP.maxCategoryNameLength) throw new FriendlyError("shop.category.tooLong");
        const shopList = {
            type,
            name,
            options: sanitizedOptions,
            items: [],
            url: []
        };
        this.shopArray.push(shopList);
    }
    editCategory(input, options = {}) {
        try {
            const result = this.checkCategory(input, true);
            applyOptions(options, result.category.options, "category");
            return result.category;
        } catch (err) {
            throw err;
        }
    }
    deleteCategory(input) {
        try {
            const result = this.checkCategory(input, true);
            this.shopArray.splice(result.index, 1);
            return result.category;
        } catch (err) {
            throw err;
        }
    }
    addItem(categoryInput, options = {}) {
        let result;
        // pass the errors to the higher function
        try {
            result = this.checkCategory(categoryInput, true);
            this.checkItem(result.category, options.id, false);
        } catch (err) {
            throw err;
        }
        const { category } = result;
        category.url = [];
        if (!options.id) throw new FriendlyError("shop.item.noID");

        if (options.price && options.price.toString().length > SHOP.maxPriceDigit) throw new FriendlyError("shop.item.highPrice");
        switch (category.type) {
            case "role": {
                const item = {
                    id: options.id,
                    price: options.price
                };
                category.items.push(item);
            }
        }
    }
    editItem(categoryInput, itemId, options = {}) {
        try {
            const result = this.checkCategory(categoryInput, true);
            const { category } = result;
            category.url = [];
            const { item } = this.checkItem(category, itemId, true);
            return applyOptions(options, item, "item");
        } catch (err) {
            throw err;
        }
    }
    deleteItem(categoryInput, itemId) {
        try {
            const result = this.checkCategory(categoryInput, true);
            const { category } = result;
            category.url = [];
            const { index } = this.checkItem(category, itemId, true);
            category.items.splice(index, 1);
        } catch (err) {
            throw err;
        }
    }
}

function applyOptions(options, item, type) {
    const sanitizedOptions = sanitizeOptions(options, type);
    const keys = Object.keys(sanitizedOptions);
    for (let i = 0, n = keys.length; i < n; i++) {
        const option = keys[i];
        item[option] = sanitizedOptions[option];
    }
    return item;
}

function sanitizeOptions(options, type) {
    let reference;
    switch (type) {
        case "category": {
            reference = SHOP.categoryOptions;
            break;
        }
        case "item": {
            reference = SHOP.itemOptions;
            break;
        }
    }
    const sanitizedOptions = {};
    const optionsArray = Object.keys(options);
    for (let i = 0, n = optionsArray.length; i < n; i++) {
        const optionKey = optionsArray[i];
        const itemIndex = reference.indexOf(optionKey);
        if (itemIndex !== -1) sanitizedOptions[optionKey] = options[optionKey];
    }
    return sanitizedOptions;
}
module.exports = ShopSetting;