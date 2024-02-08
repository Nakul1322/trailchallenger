const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RedeemCodeUser = Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            default:null
        },
        code: {
            type: String,
            default: null
        },
        status:{
            type: Boolean,
            default: false
        },
        deviceId:{
            type: String,
            default:null
        }
    },
    { timestamps: true }
);

const RedeemUser = mongoose.model("redeemcodeuser", RedeemCodeUser);
module.exports = RedeemUser