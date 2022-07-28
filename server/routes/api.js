const router = require("express").Router();
const { body, validationResult } = require("express-validator");

const User = require("../models/User");
const Chat = require("../models/Chat");

router.use((req, res, next) => next());

// Get user information
router.get("/profile", async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);
	return res.json(req.user);
});

// Get results for user search
router.get(
	"/users",
	body("searchWord").not().isEmpty().trim(),
	async (req, res) => {
		const { searchWord } = req.query;
		User.find(
			{
				_id: { $ne: req.user.id },
				username: { $regex: `.*${searchWord}.*`, $options: "i" }
			},
			"_id username",
			(err, users) => {
				if (err) console.error(err);
				else res.json({ users });
			}
		);
	}
);

// Get a list of all chats that the user is in (includes messages)
router.get("/chats", async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);

	const chats = await Chat.find({ members: req.user.id }).populate({
		path: "members",
		select: "_id username"
	});

	res.json({ chatList: chats });
});

// Create new chat
router.post("/chats", body("userList").isArray(), async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);

	const { userList } = req.body;

	// Make sure all users exist and
	for (let i = 0; i < userList.length; i++) {
		if (
			userList[i] == req.user.id ||
			(await User.findById(userList[i])) == null
		)
			return res.sendStatus(400);
	}

	const chat = await new Chat({ members: [...userList, req.user.id] }).save();
});

router.post(
	// Send message
	"/messages",
	body("recipient").not().isEmpty().trim(),
	body("message").trim(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		const { recipient } = req.body;
		if (Object.keys(req.body).includes("message")) {
			var { message } = req.body;
		}
	}
);

module.exports = router;
