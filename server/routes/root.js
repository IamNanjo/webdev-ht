const path = require("path");
const { body, validationResult } = require("express-validator");
const router = require("express").Router();

const Users = require("../models/Users");

router.use((req, res, next) => next());

router.get("/", async (req, res) => {
	if (!req.isAuthenticated()) return res.redirect("/auth/login");

	res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});

router.get("/profile", async (req, res) => {
	if (!req.isAuthenticated()) return res.redirect("/auth/login");

	res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});

router.get("/messages", async (req, res) => {
	if (!req.isAuthenticated()) return res.redirect("/auth/login");

	res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});

router.put(
	"/profile",
	body("email").normalizeEmail().isEmail(),
	body("username").not().isEmpty().trim(),
	async (req, res) => {
		if (!req.isAuthenticated()) return res.sendStatus(401);

		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		let { email, username } = req.body;

		const emailTaken = await Users.findOne({ email });
		const usernameTaken = await Users.findOne({ username });

		// If email or username is taken by someone other than the user requesting the update
		if (emailTaken) {
			if (emailTaken._id != req.user.id)
				return res.status(409).json({ message: "Email already taken" });
		}
		if (usernameTaken) {
			if (usernameTaken._id != req.user.id)
				return res
					.status(409)
					.json({ message: "Username already taken" });
		}

		Users.findById(req.user.id, async (err, user) => {
			if (err) {
				console.error(err);
				return res.sendStatus(500);
			}

			user.email = email;
			user.username = username;

			await user.save();

			// Login with the updated user
			req.login(user, (err) => {
				if (err) console.error(err);
				res.sendStatus(200);
			});
		});
	}
);

router.delete("/profile", async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);

	const success = await Users.deleteOne({ _id: req.user.id });

	if (success) res.sendStatus(200);
	else res.sendStatus(500);
});

module.exports = router;
