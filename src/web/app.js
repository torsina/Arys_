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

// classe api
class API {
    // objet qui sera créé quand on va instancié la classe
    constructor() {
        // this correspond à l'objet instancié, toutes ces définitions de propriétés sont des propiété de la classe quand elle va être instancée
        this.db = r;
        // serveur expres
        this.app = express();
        // librairie de getion de OAuth2
        this.passport = passport;
        // création de la webSocket avec le serveur situé dans le processus maitre
        this.ws = new ws(`ws://${webSocket.host}:${webSocket.port}`); // eslint-disable-line new-cap
        this.oauthScopes = config.oauthScopes;
        // propriétés que l'on va donner aux différents routeurs pour éviter de devoir les ré-importés
        const routerOptions = { db: this.db, oauthScopes: config.oauthScopes, checkAuth: this.checkAuth, ws: this.ws };
        // on place les routeurs qui sont des objets dans l'instantiation de la classe
        this.authRouter = new AuthRouter(routerOptions);
        this.APIRouter = new APIRouter(routerOptions);
        this.profileRouter = new ProfileRouter(routerOptions);
        // on créer une variable "app" pour évité d'avoir à appeler "this.app" à chaque fois
        const { app } = this;

        // code obligatoire de passport
        this.passport.serializeUser((user, done) => {
            done(null, user);
        });
        this.passport.deserializeUser((obj, done) => {
            done(null, obj);
        });

        // configuration de passport
        // une Strategy est la manière de se connecter à un serveur OAuth en fonction des applications, chaque application possède une manière de se connecter diférente
        // clientID est l'ID du bot
        // clientSecret est le "mot de passe" du bot pour l'OAuth
        // callbackURL est l'adresse à laquelle discord va nous renvoyer une fois connécté
        // scope est un tableau contenant toutes les permissions que l'on demande à discord pour l'utilisateur,
        // ici on veut ses serveurs et son identitée générale
        this.passport.use(new Strategy({
            clientID: oAuthConfig.clientID,
            clientSecret: oAuthConfig.clientSecret,
            callbackURL: oAuthConfig.callbackURL,
            scope: config.oauthScopes
        }, (accessToken, refreshToken, profile, done) => {
            // code obligatoire de passport
            return done(null, profile);
        }));

        // configuration du sysème de session et de cookie
        // secret est une chaine de caractère qui est utilisée pour encrypté l'identifiant du cookie
        // resave signifie que les données de la session vont être re-sauvegardés à chaque fois qu'on les utilisent
        // saveUninitialized signifie qu'une session sans données (non connéctée) ne sera pas sauvegardée dans la base de donnée,
        // store permet de lié la librairie faisant le lien avec la base de donnée pour sauvegardé les sessions avec la librairie gérant les sessions
        app.use(session({
            secret: privateConfig.API.sessionSecret,
            resave: true,
            saveUninitialized: false,
            store: store
        }));
        // on lie le système d'express au serveur express
        app.use(passport.initialize());
        // on lie la gestion de passport des données de session au serveur express
        app.use(passport.session());

        // on lie les routeurs à leur routes
        app.use("/auth", this.authRouter.router);
        app.use("/profile", this.profileRouter.router);
        app.use("/api", this.checkAuth, this.APIRouter.router);

        // on utilise le serveur express également comme serveur de fichier statiques
        app.use("/index.html", (req, res) => {
            res.sendFile(`${__dirname}/index.html`);
        });
        app.use("/index.css", (req, res) => {
            res.sendFile(`${__dirname}/index.css`);
        });
        app.use("/script.js", (req, res) => {
            res.sendFile(`${__dirname}/script.js`);
        });
        app.use("/fond.jpg", (req, res) => {
            res.sendFile(`${__dirname}/fond.jpg`);
        });
        app.use("/pages", express.static(`${__dirname}/pages`));

        app.get("/logout", (req, res) => {
            req.session.destroy((err) => {
                if (err) throw err;
                req.logout();
                res.redirect("/");
            });
        });
        // on écoute les connections sur l'adresse avec le port 5000
        app.listen(5000, (err) => {
            if (err) return console.log(err);
            console.log("Listening at http://localhost:5000/");
        });
    }
    // une fonction que l'on pourra appelé dans les instance de la classe, qui vérifie si une personne est authentifiée
    checkAuth(req, res, next) {
        if (req.isAuthenticated()) return next();
        res.send("not logged in :(");
    }
}
module.exports = API;
