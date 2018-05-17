const express = require("express");
const ws = require("ws");
const session = require("express-session");
const passport = require("passport");
const { Strategy } = require("passport-discord");
const AuthRouter = require("./routes/auth-routes");
const ProfileRouter = require("./routes/profile-routes");
const APIRouter = require("./routes/api-routes");
const config = require("../../config");
const { db, webSocket } = config;
const privateConfig = require("../../config_private");
const oAuthConfig = privateConfig.oauth;
const r = require("rethinkdbdash")(db);
const RDBStore = require("session-rethinkdb")(session);

const store = new RDBStore(r);

class API {
    constructor() {
        this.db = r;
        this.app = express();
        this.passport = passport;
        this.ws = new ws(`ws://${webSocket.host}:${webSocket.port}`); // eslint-disable-line new-cap
        this.oauthScopes = config.oauthScopes;
        const routerOptions = { db: this.db, oauthScopes: config.oauthScopes, checkAuth: this.checkAuth, ws: this.ws };
        this.authRouter = new AuthRouter(routerOptions);
        this.APIRouter = new APIRouter(routerOptions);
        this.profileRouter = new ProfileRouter(routerOptions);
        const { app } = this;

        this.passport.serializeUser((user, done) => {
            done(null, user);
        });
        this.passport.deserializeUser((obj, done) => {
            done(null, obj);
        });

        this.passport.use(new Strategy({
            clientID: oAuthConfig.clientID,
            clientSecret: oAuthConfig.clientSecret,
            callbackURL: oAuthConfig.callbackURL,
            scope: config.oauthScopes
        }, (accessToken, refreshToken, profile, done) => {
            return done(null, profile);
        }));

        app.use(session({
            secret: privateConfig.API.sessionSecret,
            resave: true,
            saveUninitialized: true,
            store
        }));
        app.use(passport.initialize());
        app.use(passport.session());

        // set up routes
        app.use("/auth", this.authRouter.router);
        app.use("/profile", this.profileRouter.router);
        app.use("/api", this.checkAuth);
        app.use("/api", this.checkAuth, this.APIRouter.router);

        // use nginx server to get index.html, then angular does it's job and we only have routes to retrives/post data and not html

        app.get("/logout", (req, res) => {
            req.logout();
            res.redirect("/");
        });
        app.get("/info", this.checkAuth, (req, res) => {
            // console.log(req.user)
            res.json(req.user);
        });
        app.listen(5000, (err) => {
            if (err) return console.log(err);
            console.log("Listening at http://localhost:5000/");
        });
    }
    checkAuth(req, res, next) {
        if (req.isAuthenticated()) return next();
        res.send("not logged in :(");
    }
}
module.exports = API;