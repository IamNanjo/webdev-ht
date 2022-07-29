const router = require("express").Router();
const { body, validationResult } = require("express-validator");

const User = require("../models/User");
const { Chat, Message } = require("../models/Chat");

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

	const chat = new Chat({ members: [...userList, req.user.id] }).save(
		(err) => {
			if (err) {
				console.error(err);
				return res.sendStatus(500);
			} else res.sendStatus(201);
		}
	);
});

router.delete("/chats", body("id").not().isEmpty().trim(), async (req, res) => {
	if (!req.isAuthenticated()) return res.sendStatus(401);
	const errors = validationResult(req);
	if (!errors.isEmpty())
		return res.status(400).json({ errors: errors.array() });

	const { id } = req.body;

	const chat = await Chat.findById(id);

	// If the request user is not in the chat
	if (!chat.members.includes(req.user.id)) return res.sendStatus(403);

	// If chat would be left empty, delete it completely
	if (chat.members.length <= 1) {
		Chat.findByIdAndDelete(id);
	} else {
		chat.members = chat.members.filter((member) => member != req.user.id);
	}

	chat.save((err) => {
		if (err) res.sendStatus(500);
		else res.sendStatus(200);
	});
});

// Send message
router.post(
	"/messages",
	body("recipient").not().isEmpty().trim(),
	body("message").not().isEmpty().trim(),
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty())
			return res.status(400).json({ errors: errors.array() });

		const { recipient, message } = req.body;

		let chat = Chat.findById(recipient);
		if (chat == null) return res.sendStatus(404);

		chat.messages.push(new Message());
	}
);

module.exports = router;
