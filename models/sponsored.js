const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const SponsoredSchema = new Schema({
    link: {
        type: String,
        default: null
    },
    status:{
        type: Number,
        default: 1 // 1-Active, 0-inactive
    }
}, {
    versionKey: false,
    timestamps: true
});

const Sponsored = mongoose.model('sponsored', SponsoredSchema)
module.exports = Sponsored;