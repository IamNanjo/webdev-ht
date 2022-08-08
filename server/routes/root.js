const path = require("path");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const router = require("express").Router();

const Chat = require("../models/Chat");
const User = require("../models/User");

router.use((req, res, next) => next());

router.get("/", async (req, res) => {
	if (!req.isAuthenticated()) return res.redirect("/auth/login");

	res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});

// Profile page
router.get("/profile", async (req, res) => {
	if (!req.isAuthenticated()) return res.redirect("/auth/login");

	res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});

// Messages page
router.get("/messages", async (req, res) => {
	if (!req.isAuthenticated()) return res.redirect("/auth/login");

	res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});

// Update account email or username
router.put(
	"/profile",
	body("email").normalizeEmail().isEmail(),
	body("username").not().isEmpty().trim(),
	body("currentPassword").isString(),
	body("newPassword").isString(),
	async (req, res) => {
		if (!req.isAuthenticated()) return res.sendStatus(401);

		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		let { email, username, currentPassword, newPassword } = req.body;

		// Await these calls in parallel
		const [emailTaken, usernameTaken] = await Promise.all([
			User.findOne({ email }),
			User.findOne({ username })
		]);

		// If email or username is taken by someone other than the user requesting the update
		if (emailTaken && emailTaken._id != req.user.id) {
			return res.status(409).json({ message: "Email already taken" });
		}
		if (usernameTaken && usernameTaken._id != req.user.id) {
			return res.status(409).json({ message: "Username already taken" });
		}

		// Get user from the database and update email and username
		User.findById(req.user.id, async (err, user) => {
			if (err) {
				console.error(err);
				return res.sendStatus(500);
			}

			user.email = email;
			user.username = username;

			// Update password
			if (currentPassword && newPassword) {
				const match = await bcrypt.compare(currentPassword, user.password);

				if (match) {
					user.password = await bcrypt.hash(newPassword, 10);
				} else {
					return res.status(403).json({ message: "Incorrect password" });
				}
			}

			await user.save();

			// Login with the updated user
			req.login(user, (err) => {
				if (err) console.error(err);
				res.sendStatus(200);
			});
		});
	}
);

// Delete account
router.delete("/profile", async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);

	Chat.find({ members: req.user.id }, async (err, chats) => {
		if (err) {
			console.error(err);
			return res.sendStatus(500);
		}

		// Remove user from chats
		if (chats.length) {
			for (let i = 0; i < chats.length; i++) {
				let chat = chats[i];
				if (chat.members.length > 1) {
					console.log("Removing user from chat");
					await Chat.findByIdAndUpdate(chat._id, {
						$pull: { members: req.user.id }
					});
				} else {
					console.log("Deleting chat");
					await Chat.findByIdAndDelete(chat._id);
				}
			}
		}

		const success = await User.findByIdAndDelete(req.user.id);

		if (success) res.sendStatus(200);
		else res.sendStatus(500);
	});
});

module.exports = router;
