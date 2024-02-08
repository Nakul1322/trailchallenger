const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AnnouncementUserSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: null
    },
    deviceId:{
        type: String
    },
    isViewed: {
        type: Boolean,
        default:false
    },
    announcementId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "announcements",
        default: null
    }
},
    {
        timestamps: true
    });

const AnnouncementUser = mongoose.model("announcementusers", AnnouncementUserSchema);
module.exports = AnnouncementUser;

