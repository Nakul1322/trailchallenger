const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RedeemCodeSchema = new Schema({
    code: {
        type: String,
    },
    quantity: {
        type: Number,
    },
    trailType: {
        type: String,
        enum: ['Long Trail', 'Day Hike']
    },
    redeemed: {
        type: Boolean,
        default: false
    },
    count:{
        type: Number,
        default: 0
    }
},
    {
        timestamps: true
    });

const RedeemCode = mongoose.model("redeemcode", RedeemCodeSchema);
module.exports = RedeemCode;