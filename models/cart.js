const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CartSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null
    },
    products: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
      isRedeemed:{
        type:Boolean,
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
    },
    {
      timestamps: true,
    }],

    subTotal: {
      default: 0,
      type: Number,
    },
    cartCount: {
      default: 0,
      type: Number
    },
    deviceId:{
      type: String
    }
  },
  {
    timestamps: true,
  }
);
const Cart = mongoose.model("cart", CartSchema);
module.exports = Cart