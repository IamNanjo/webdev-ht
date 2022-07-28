const path = require("path");
const passport = require("passport");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");

const mongoose = require("mongoose");
const User = require("../models/User");

const router = require("express").Router();

router.use((req, res, next) => next());

router.get("/register", (req, res) =>
	res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"))
);

// TODO: Make sure emails are unique

router.post(
	"/register",
	// Validate request body
	body("email").normalizeEmail().isEmail(),
	body("username").not().isEmpty().trim(),
	body("password").isLength({ min: 6 }).trim(),
	async (req, res, next) => {
		// Handle any errors in request
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		let { email, username, password } = req.body;

		const emailTaken = (await User.find({ email: req.body.email })).length;
		const usernameTaken = (await User.find({ username: req.body.username }))
			.length;

		if (emailTaken) {
			return res.status(409).json({ message: "Email already taken" });
		} else if (usernameTaken) {
			return res.status(409).json({ message: "Username already taken" });
		}

		bcrypt
			.hash(password, 10)
			.then(async (hashedPassword) => {
				password = hashedPassword;

				const user = new User({ email, username, password });

				await user.save();

				req.login(user, (err) => {
					if (err) {
						console.error(err);
						return next(err);
					} else return res.redirect("/profile");
				});
			})
			.catch((err) => {
				console.error(err);
				try {
					// This might try to modify headers after a response is already sent
					res.sendStatus(500);
				} catch {}
			});
	}
);

router.get("/login", (req, res, next) => {
	if (req.isAuthenticated()) return res.redirect("/profile");
	return res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});

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
				return res.redirect("/profile");
			});
		}
	)(req, res, next);
});

// Accept any method for logging out
router.all("/logout", (req, res) => {
	if (!req.isAuthenticated()) return res.redirect("/auth/login");

	req.logout((err) => {
		if (err) console.error(err);
		res.redirect("/profile");
	});
});

module.exports = router;
