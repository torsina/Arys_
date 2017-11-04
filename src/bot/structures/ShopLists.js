class ShopLists {
    constructor(data) {
        const shopListArray = Object.keys(data);
        for (let i = 0, n = shopListArray.length; i < n; i++) {
            const shopList = data[shopListArray[i]];
            // to prevent from iterating over things we don't want
            if (typeof shopList === "object") {
                if (shopList.type === "role") {
                }
            }
        }
    }
}
module.exports = ShopLists;