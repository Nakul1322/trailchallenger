const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LeaderBoardSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
    },
    trailId: {
        type: Schema.Types.ObjectId,
        ref:"challenges",
        required: true,
    },
    deviceId: {
        type: String,
        default: null
    },
    rank: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,
        default: 0
    }
    },
    {
        timestamps: true
    });

const LeaderBoard = mongoose.model("leaderboards", LeaderBoardSchema);
module.exports = LeaderBoard;