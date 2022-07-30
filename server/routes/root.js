const path = require("path");
const { body, validationResult } = require("express-validator");
const router = require("express").Router();

const Chat = require("../models/Chat");
const User = require("../models/User");

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

		const emailTaken = await User.findOne({ email });
		const usernameTaken = await User.findOne({ username });

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

		User.findById(req.user.id, async (err, user) => {
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

	Chat.find({ members: req.user.id }, async (err, chats) => {
		if (err) {
			console.error(err);
			return res.sendStatus(500);
		}

		// Remove user from chats
		if (chats.length) {
			for await (const chat of chats) {
				if (chat.members.length > 1) {
					Chat.findOneAndUpdate(
						chat,
						{
							$pull: { members: req.user.id }
						},
						(err) => {
							if (err) {
								console.error(err);
								return res.sendStatus(500);
							}
						}
					);
				} else {
					Chat.deleteOne(chat, (err) => {
						if (err) {
							console.error(err);
							return res.sendStatus(500);
						}
					});
				}
			}
		}

		const success = await User.findByIdAndDelete(req.user.id);

		if (success) res.sendStatus(200);
		else res.sendStatus(500);
	});
});

module.exports = router;
