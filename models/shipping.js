const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const ShippingSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        default: null
    },
    name: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: String,
        default: "1234567890"
    },
    billingAddress: {
        type: Object,
        required: true,
        default: ''
    },
    countryCode: {
        type: String,
    },
    address: {
        type: Object,
        required: true,
        default: ''
    },
    // address: {
    // line1: { type: String },
    // postal_code: { type: String },
    // city: { type: String },
    // state: { type: String },
    // country: { type: String }
    //},
    createdAt: Date,
    updatedAt: Date
}, {
    versionKey: false,
    timestamps: true
});

const Shipping = mongoose.model('shipping', ShippingSchema)
module.exports = Shipping;