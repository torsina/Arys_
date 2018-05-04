const router = require("express").Router(); // eslint-disable-line new-cap
const passport = require("passport");

class authRouter {
    constructor(data) {
        this.db = data.db;
        this.oAuthScopes = data.oauthScopes;
        this.router = require("express").Router(); // eslint-disable-line new-cap
        this.router.get("/login", (req, res) => {
            res.render("login", { user: req.user });
        });

        this.router.get("/logout", (req, res) => {
            req.logout();
            res.redirect("/");
        });

        this.router.get("/discord", passport.authenticate("discord", { scope: this.oAuthScopes }));
        this.router.get("/discord/redirect",
            passport.authenticate("discord", { failureRedirect: "/" }), (req, res) => {
                res.redirect("/profile");
                console.log(req.user);
            }
            // auth success
        );
    }
}

/**
 *
 router.get("/discord", passport.authenticate("discord", { scopes: ["profile", "guilds"] }));

 // callback route for google to redirect to
 // hand control to passport to use code to grab profile info
 router.get("/discord/redirect", passport.authenticate("discord"), (req, res) => {
    res.send(req.user);
    res.redirect("/profile");
});
 */

module.exports = authRouter;
