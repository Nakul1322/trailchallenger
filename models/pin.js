const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PinModel = Schema(
    {
        title: {
            type: String,
            default: null
        },
        pinName: {
            type: String,
            default: null
        },
        pinType: {
            type: String,
            default: null
            // type: Number,
            // enum: [{ Transport: 0, Landmark: 1, Toilets: 2, Snacks: 3, Information: 4 }],
        },
        challengeId: {
            type: Schema.Types.ObjectId,
            ref: 'challenges',
            default: null
        },
        pinImage: {
            type: String,
            default: null,
            set: function (value) {
                // if the value of pinImage starts with https://trailchalleger.s3.ap-south-1.amazonaws.com/,
                // return it as is, otherwise add the prefix
                if (value && !value.startsWith('https://')) {
                    value = 'https://trailchalleger.s3.ap-south-1.amazonaws.com/' + value;
                }
                return value;
            }
        },
        headLine: {
            type: String,
            default: null
        },
        comment: {
            type: String,
            default: null
        },
        lat_long: {
            type: String,
            trim: true,
            default: null
        }
    },
    { timestamps: true }
);

const Pin = mongoose.model("pins", PinModel);
module.exports = Pin