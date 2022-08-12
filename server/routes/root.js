const path = require("path");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const router = require("express").Router();

const Chat = require("../models/Chat");
const User = require("../models/User");

router.use((req, res, next) => next());

router.get("/", async (req, res) => {
	if (!req.isAuthenticated()) res.redirect("/auth/login");
	else res.redirect("/messages");
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

// Change username or password
router.put(
	"/profile",
	body("username").not().isEmpty().trim(),
	body("currentPassword").isString(),
	body("newPassword").isString(),
	async (req, res) => {
		if (!req.isAuthenticated()) return res.sendStatus(401);

		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		let { username, currentPassword, newPassword } = req.body;

		// Null or object
		const usernameTaken = await User.findOne({ username });

		// If username is taken by someone other than the user requesting the update
		if (usernameTaken && usernameTaken._id != req.user.id) {
			return res.status(409).json({ message: "Username already taken" });
		}

		// Get user from the database and update username and password
		User.findById(req.user.id, async (err, user) => {
			if (err) {
				console.error(err);
				return res.sendStatus(500);
			}

			user.username = username;

			// Update password
			if (currentPassword && newPassword) {
				const match = await bcrypt.compare(
					currentPassword,
					user.password
				);

				if (match) {
					user.password = await bcrypt.hash(newPassword, 10);
				} else {
					return res
						.status(403)
						.json({ message: "Incorrect password" });
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

		if (success) {
			req.logout((err) => {
				if (err) return res.sendStatus(500);
				res.sendStatus(200);
			});
		} else res.sendStatus(500);
	});
});

module.exports = router;
