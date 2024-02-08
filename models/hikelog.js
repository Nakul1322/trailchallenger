const date = require("joi/lib/types/date");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HikeLogSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    trailId: {
        type: Schema.Types.ObjectId,
        ref: "challenges",
        required: true,
    },
    completionPercentage: {
        type: Number,
        default: 0
    },
    currentDistance: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,
        default: 0
    },
    startTime: {
        type: Date,
        default: null
    },
    endTime: {
        type: Date,
        default: null
    },
    hikeId: {
        type: Schema.Types.ObjectId,
        ref: "myhikes",
        required: true,
    }
},
    {
        timestamps: true
    });

const HikeLog = mongoose.model("hikelogs", HikeLogSchema);
module.exports = HikeLog;