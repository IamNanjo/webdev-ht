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

// HTTPS server config (certificate files)
const server = createServer(
	{
		key: readFileSync(`/etc/letsencrypt/live/nanjo.tech/privkey.pem`),
		cert: readFileSync(`/etc/letsencrypt/live/nanjo.tech/fullchain.pem`)
	},
	app
);

const passport = require("passport");
const LocalStrategy = require("passport-local");

// MongoDB config
const mongoose = require("mongoose");
const User = require("./models/User");

const mongoURI = "mongodb://localhost:27017/webdev-ht";

// Store for sessions
const store = new MongoDBStore({
	uri: mongoURI,
	collection: "sessions"
});

store.on("error", (err) => console.error(err));

mongoose.connect(mongoURI);

passport.use(
	// This is the function that will be called whenever a user needs to be logged in
	new LocalStrategy((username, password, cb) => {
		// Looks for a user from the database and checks that the user gave the correct password
		User.findOne({ username }, (err, user) => {
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

// This is where we choose what we save in cookies
// In this app we only need the user ID, email and username
// This app could also work with just the ID but this way we don't need as many database queries
passport.serializeUser((user, cb) => {
	process.nextTick(() => {
		return cb(null, {
			// Change MongoDB ObjectID to string
			id: user["_id"].toString(),
			email: user["email"],
			username: user["username"]
		});
	});
});

passport.deserializeUser((user, cb) => {
	process.nextTick(() => cb(null, user));
});

// Paths to static files
const rootPath = path.join(__dirname, "..", "dist");
const docPath = path.join(__dirname, "..", "documentation");

// Express config / middlewares
app.set("trust proxy", 1);
app.use(
	session({
		// Normally you should never reveal this secret.
		// This secret is used to encrypt cookies.
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

// Listen on this port (https//webdev-ht.nanjo.tech uses a reverse proxy in Apache)
server.listen(10443, () => console.log("Server listening on ", 10443));
