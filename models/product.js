const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true
        },
        desc: {
            type: String, required: true
        },
        aboutTheProduct: {
            type: String, required: true
        },
        img:[{
            type: String,
            default:null,
            set: function (value) {
                // if the value of pinImage starts with https://trailchalleger.s3.ap-south-1.amazonaws.com/,
                // return it as is, otherwise add the prefix
                if (value && !value.startsWith('https://')) {
                    value = 'https://trailchalleger.s3.ap-south-1.amazonaws.com/' + value;
                }
                return value;
            }
        }],
        categoryId: {
            type: Number,
            ref: 'category'
        },
        quantity: {
            type: Number
        },
        price: {
            type: Number,
            required: true
        },
    },
    { timestamps: true }
);

const Product = mongoose.model("products", ProductSchema);
module.exports = Product