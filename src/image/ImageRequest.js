const constants = require("../util/constants");
class ImageRequest {
    // TODO do error locales instead
    constructor(data) {
        if (!data) throw new Error("This request does not have any data");
        this.type = data.type;
        if (!this.type) throw new Error("The type of the request is not defined");
        if (constants.IMAGE_TYPES.findIndex(index => index === this.type) === -1) throw new Error(`The type ${this.type} does not exists`);
        this.data = data.data;
        if (!this.data) throw new Error("The data of this request is not defined");
        switch (this.type) {
            case "roleShop": {
                if (data.data.list.length >= constants.IMAGE_ROLESHOP.max) throw new Error("The list of roles is too long for the request");
            }
        }
    }
}
module.exports = ImageRequest;