const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RedeemMedalSchema = Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'users'
        },
        trailId: {
            type: Schema.Types.ObjectId,
            ref: 'challenges'
        },
        isCompleted: {
            type: Boolean,
            default: false
        },
        isRedeemed:{
            type: Boolean,
            default: false
        },
        isMedalRedeemed:{
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const RedeemMedal = mongoose.model("redeemmedals", RedeemMedalSchema);
module.exports = RedeemMedal