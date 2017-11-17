class FriendlyError extends Error {
    constructor(message) {
        super(message);
        this.name = "User friendly error";
    }
}
module.exports = FriendlyError;