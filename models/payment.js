const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        default:null
    },
    totalPrice: {
        type: String,
    },
    price: {
        type: String,
    },
    paymentType:{
        type: String
    },
    deliveryType:{
        type: Number,
        default: 0
    },
    customerId: {
        type: String
    }
    },
    {
        timestamps: true
    });

const Payment = mongoose.model("payment", paymentSchema);
module.exports = Payment;