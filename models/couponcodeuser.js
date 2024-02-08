const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CouponCodeUser = Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'users'
        },
        code: {
            type: String,
            default: null
        },
        status: {
            type: Boolean,
            default: false
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'orders',
            default: null
        },
    },
    { timestamps: true }
);

const CouponUser = mongoose.model("couponcodeusers", CouponCodeUser);
module.exports = CouponUser