const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ContactUsSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    content: {
        type: String,
    }
    },
    {
        timestamps: true
    });

const ContactUs = mongoose.model("contactus", ContactUsSchema);
module.exports = ContactUs;