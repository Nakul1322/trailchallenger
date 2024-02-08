const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const SponsoredUserSchema = new Schema({
    link: {
        type: String,
        default: null
    },
    status:{
        type: Number,
        default: 1 // 1-Active, 0-inactive
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users"
    }
}, {
    versionKey: false,
    timestamps: true
});

const Sponsored = mongoose.model('sponsoredusers', SponsoredUserSchema)
module.exports = Sponsored;