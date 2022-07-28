const { createServer } = require("https");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const app = express();
const path = require("path");
const { readFileSync } = require("fs");
const bcrypt = require("bcrypt");

const rootRouter = require("./routes/root");
const authRouter = require("./routes/auth");
const apiRouter = require("./routes/api");

const server = createServer(
	{
		key: readFileSync(`/etc/letsencrypt/live/nanjo.tech/privkey.pem`),
		cert: readFileSync(`/etc/letsencrypt/live/nanjo.tech/fullchain.pem`)
	},
	app
);

const passport = require("passport");
const LocalStrategy = require("passport-local");

const mongoose = require("mongoose");
const Users = require("./models/Users");

const mongoURI = "mongodb://localhost:27017/webdev-ht";

// Where to store sessions
const store = new MongoDBStore({
	uri: mongoURI,
	collection: "sessions"
});

store.on("error", (err) => console.error(err));

mongoose.connect(mongoURI);

passport.use(
	new LocalStrategy((username, password, cb) => {
		Users.findOne({ username }, (err, user) => {
			if (err) return cb(err);
			if (!user) {
				return cb(null, false, {
					message: "Incorrect username",
					status: 404
				});
			}

			bcrypt.compare(password, user.password, (err, result) => {
				if (err) return cb(err);
				if (!result) {
					return cb(null, false, {
						message: "Incorrect password",
						status: 401
					});
				}

				return cb(null, user);
			});
		});
	})
);

passport.serializeUser(function (user, cb) {
	process.nextTick(() => {
		return cb(null, {
			id: user["_id"].toString(),
			email: user["email"],
			username: user["username"]
		});
	});
});

passport.deserializeUser(function (user, cb) {
	process.nextTick(() => cb(null, user));
});

const rootPath = path.join(__dirname, "..", "dist");
const docPath = path.join(__dirname, "..", "documentation");

app.set("trust proxy", 1);
// Session configuration
app.use(
	session({
		secret: "nmxLC3bG6rYPmR$B$CFDi!iR$qn34yonk7t5AHTx",
		resave: true,
		saveUninitialized: false,
		cookie: { secure: true },
		store: store
	})
);
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/documentation", express.static(docPath));
app.use("/", rootRouter);
app.use("/auth", authRouter);
app.use("/api", apiRouter);
app.use("/", express.static(rootPath, { index: false }));

server.listen(10443, () => console.log("Server listening on ", 10443));
