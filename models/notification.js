const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    notificationMessage: {
        type: String,
    },
    userId: [{
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    }],
    allUsers: {
        type: Boolean,
        default: false
    }
    },
    {
        timestamps: true
    });

const Notification = mongoose.model("notification", NotificationSchema);
module.exports = Notification;