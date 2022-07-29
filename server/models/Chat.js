const { Schema, model } = require("mongoose");

// Sender refers to User ID
const Message = new Schema({
	sender: { type: Schema.Types.ObjectId, required: true, ref: "User" },
	recipient: { type: String, required: true },
	content: { type: String, required: true },
	createdOn: { type: Date, default: Date.now }
});

// Members refer to User IDs
const Chat = new Schema({
	members: { type: [Schema.Types.ObjectId], required: true, ref: "User" },
	messages: { type: [Message], default: [] },
	createdOn: { type: Date, default: Date.now }
});

module.exports = {
	Chat: model("Chat", Chat),
	Message: model("Message", Message)
};
