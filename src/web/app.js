const express = require("express");
const session = require("express-session");
const passport = require("passport");
const { Strategy } = require("passport-discord");
const app = express();
const authRoutes = require("./routes/auth-routes");
const profileRoutes = require("./routes/profile-routes");
const APIRoutes = require("./routes/api-routes");
const { db } = require("../../config");
const { oauth } = require("../../config_private");
const r = require("rethinkdbdash")(db);
const RDBStore = require("session-rethinkdb")(session);

const store = new RDBStore(r);

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

const scopes = ["identify", "guilds"];

passport.use(new Strategy({
    clientID: oauth.clientID,
    clientSecret: oauth.clientSecret,
    callbackURL: "http://localhost:5000/auth/discord/redirect",
    scope: scopes
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

app.use(session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
    store
}));
app.use(passport.initialize());
app.use(passport.session());

// set up routes
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/api", APIRoutes);

// use nginx server to get index.html, then angular does it's job and we only have routes to retrives/post data and not html

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});
app.get("/info", checkAuth, (req, res) => {
    // console.log(req.user)
    res.json(req.user);
});


function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.send("not logged in :(");
}


app.listen(5000, (err) => {
    if (err) return console.log(err);
    console.log("Listening at http://localhost:5000/");
});