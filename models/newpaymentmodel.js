const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PaymentRecordSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        default: null
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
            default: null
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, "Quantity can not be less then 1."],
            default: null
        },
        price: {
            type: Number,
            required: true,
            default: null
        },
        total: {
            type: Number,
            required: true,
            default: null
        },
        isRedeemed: {
            type: Boolean,
            default: false
        },
        title: { type: String, default: null }
    }],
    isRedeemed: {
        type: Boolean,
        default: false
    },
    paymentStatus: {
        type: Number,
        enum: [{ Succeeded: 1, Failed: 0 }],
        default: 1
    },
    paymentType: {
        type: String
    },
    trails: [{
        trailId: {
            type: Schema.Types.ObjectId,
            ref: 'challenges',
            default: null
        },
        trailName: {
            type: String,
            default: null
        },
        trailPrice: {
            type: Number,
            default: null
        }
    }],
    hikeId:{
        type: Schema.Types.ObjectId,
        ref: 'myhikes',
        default: null
    },
},
    {
        timestamps: true
    });

const Payment = mongoose.model("paymentrecord", PaymentRecordSchema);
module.exports = Payment;