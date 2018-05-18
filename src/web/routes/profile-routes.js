class ProfileRouter {
    constructor(data) {
        this.db = data.db;
        this.router = require("express").Router();
        this.authCheck = (req, res, next) => {
            if (!req.user) {
                res.redirect("/auth/login");
            } else {
                return next();
            }
        };

        this.router.get("/", this.authCheck, (req, res) => {
            res.render("profile", { user: req.user });
        });
    }
}

module.exports = ProfileRouter;
