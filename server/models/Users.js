const mongoose = require("mongoose");

const Users = new mongoose.Schema({
    email: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    profilePicture: {
        data: Buffer,
        contentType: String
    }
});

module.exports = mongoose.model("Users", Users);