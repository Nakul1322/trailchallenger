const { Types } = require("aws-sdk/clients/acm");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AnnouncementSchema = new Schema({
    headline: {
        type: String,
    },
    text: {
        type: String,
    },
    image: {
        type: String,
        default: ""
    },
    buttonText: {
        type: String,
    },
    // buttonDestination: {
    //     type: String,
    // },
    buttonDestination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "announcementbuttons",
        default: null
    },
    startDate: {
        type: Date,
    },
    expiryDate: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: false
    },
    destinationId: {
        type: String
    }
},
    {
        timestamps: true
    });

const Announcement = mongoose.model("announcements", AnnouncementSchema);
module.exports = Announcement;

