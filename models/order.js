const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
        },
        isRedeemed: {
            type: Boolean,
            default: false
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, "Quantity can not be less then 1."],
        },
        price: {
            type: Number,
            required: true,
        },
        total: {
            type: Number,
            required: true,
        },
        desc: { type: String },
        title: { type: String },
        img: [{
            type: String,
            default: null
        }],
    }],
    couponCode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "couponcodes"
    },
    orderNumber: {
        type: String,
        default: null
    },
    subTotal: {
        default: 0,
        type: Number,
    },
    paymentMethod: {
        type: String,
        enum: ['Apple Pay', 'PayPal', 'Card Payment', 'Coupon Code/Card Payment', 'Redeem Code/Card Payment', 'Redeem Code', 'Coupon Code', '', 'Free'],
    },
    address: {
        type: Object,
        required: true,
        default: ''
    },
    orderStatus: {
        type: Boolean,
        default: false
    },
    deliveryType: {
        type: Number, //0--> free 1---> express
        default: 0,
    },
    orderType: {
        type: Number, //1--> phys 2---> digital
        default: 0,
        required: true
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
        trailDistance: {
            type: Number,
            default: null
        },
        trailPrice: {
            type: Number,
            default: null
        },
        colorGradient: [String]
    }]
},
    {
        timestamps: true,
    });

const Order = mongoose.model("orders", OrderSchema);

module.exports = Order;