const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CouponCodeSchema = new Schema({
    code: {
        type: String,
    },
    amount: {
        type: Number,
    },
    type: {
        type: String,
        enum: ['% Discount', 'Cash Discount']
    },
    couponed: {
        type: Boolean,
        default: false
    },
    // quantity: {
    //     type: Number,
    // },
    expires: {
        type: Date
    },
},
    {
        timestamps: true
    });

const CouponCode = mongoose.model("couponcode", CouponCodeSchema);
module.exports = CouponCode;

