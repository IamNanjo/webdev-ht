const mongoose = require("mongoose");

const Messages = new mongoose.Schema({
	sender: { type: mongoose.Schema.Types.ObjectId, required: true },
	recipient: { type: String, required: true },
	content: { type: String, required: true },
	createdOn: { type: Date, required: true }
});

const Chats = new mongoose.Schema({
	members: { type: [mongoose.Schema.Types.ObjectId], required: true },
	isGroupChat: { type: Boolean, default: false, required: true },
	messages: { type: Messages },
	lastMsg: { type: String }
});

module.exports = mongoose.model("Chats", Chats);
