const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReportedUserSchema = new Schema({
    reportedUserId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    reportingUserId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    }
},
    {
        timestamps: true
    });

const ReportedUser = mongoose.model("reportedusers", ReportedUserSchema);
module.exports = ReportedUser;