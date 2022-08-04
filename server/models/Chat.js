const { Schema, model } = require("mongoose");

// Message.sender and Chat.members refer to user IDs in the User schema

const Message = new Schema({
	sender: { type: Schema.Types.ObjectId, required: true, ref: "User" },
	content: { type: String, required: true },
	createdOn: { type: Date, default: Date.now }
});

const Chat = new Schema({
	members: { type: [Schema.Types.ObjectId], required: true, ref: "User" },
	messages: { type: [Message], default: [] },
	createdOn: { type: Date, default: Date.now },
});

module.exports = model("Chat", Chat);
