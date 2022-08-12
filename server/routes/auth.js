const path = require("path");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");

const User = require("../models/User");

const router = require("express").Router();

router.use((req, res, next) => next());

router.get("/register", (req, res) => {
	if (req.isAuthenticated()) return res.redirect("/messages");
	res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});

router.post(
	"/register",
	// Validate request body
	body("username").not().isEmpty().trim(),
	body("password").isLength({ min: 6 }).trim(),
	async (req, res, next) => {
		// Handle any errors in request
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		let { username, password } = req.body;

		// Null or object
		const usernameTaken = await User.findOne({ username });

		if (usernameTaken) {
			return res.status(409).json({ message: "Username already taken" });
		}

		// Create account, save it to the database and then log the user in
		bcrypt
			.hash(password, 10)
			.then(async (hashedPassword) => {
				const user = new User({
					username,
					password: hashedPassword
				});

				await user.save();

				req.login(user, (err) => {
					if (err) {
						console.error(err);
						return next(err);
					} else return res.redirect("/messages");
				});
			})
			.catch((err) => {
				console.error(err);
				if (!res.headersSent) res.sendStatus(500);
			});
	}
);

// Login page
router.get("/login", (req, res, next) => {
	if (req.isAuthenticated()) return res.redirect("/messages");
	return res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});

// Attempt login
router.post("/login", (req, res, next) => {
	passport.authenticate(
		"local",
		{ failWithError: true },
		(err, user, info) => {
			if (err) return next(err);
			if (!user)
				return res.status(info.status).json({ message: info.message });

			req.login(user, (err) => {
				if (err) console.error(err);
				return res.redirect("/messages");
			});
		}
	)(req, res, next);
});

// Accept any method for logging out
router.all("/logout", (req, res) => {
	if (!req.isAuthenticated()) return res.redirect("/auth/login");

	req.logout((err) => {
		if (err) console.error(err);
		res.redirect("/auth/login");
	});
});

module.exports = router;
