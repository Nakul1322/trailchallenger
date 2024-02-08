const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: "communities",
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    comment: {
        type: String,
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true
    });

const Comment = mongoose.model("comment", CommentSchema);
module.exports = Comment;