class FriendlyError extends Error {
    constructor(error, data = {}) {
        super(error);
        this.data = data;
    }
}
module.exports = FriendlyError;