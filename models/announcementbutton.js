const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AnnouncementButtonSchema = new Schema({
    title: {
        type: String,
    },
    status: {
            type: Number,
            enum: [{ Challenge: 0, Store: 1, Setting: 2 }],
            default: 0
    },
    isSpecific:{
        type:Boolean,
        default: false
    },
    type:{
        type: Number,
            enum: [{ LongTrail: 0, DayHike: 1, Product: 3, LocationTracking: 4, ContactUs: 5 }],
            default: 0
    }
},
    {
        timestamps: true
    });

const AnnouncementButton = mongoose.model("announcementbuttons", AnnouncementButtonSchema);
module.exports = AnnouncementButton;

