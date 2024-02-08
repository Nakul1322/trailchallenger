const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LikeSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: "communities",
        required: true,
    },
    userId:{
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    isLiked:{
        type: Boolean,
        default:false
    }
    },
    {
        timestamps: true
    });

const Like = mongoose.model("likes", LikeSchema);
module.exports = Like;