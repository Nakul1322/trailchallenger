const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: "communities",
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    }
},
    {
        timestamps: true
    });

const Report = mongoose.model("reports", ReportSchema);
module.exports = Report;