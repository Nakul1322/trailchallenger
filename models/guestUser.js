const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GuestUserSchema = new Schema({
    deviceId: {
        type: String,
    },
    lastLoginDate: {
        type: Date,
        default: Date.now
    },
    challenges:[{
        type: Schema.Types.ObjectId,
        ref: 'challenges'
    }],
    deviceToken:{
        type: String,
        default: null
    },
    deviceType:{
        type: Number,
        enum: [{ Android: 0, Iphone: 1 }],
        default: 1
    },
    countryId:{
        type: Number,
        default: 1
    }
},
    {
        timestamps: true
    });

// GuestUserSchema.statics.login = function login(id, callback) {
//     return this.findByIdAndUpdate(id, { '$set': { 'lastLoginDate': Date.now() } }, { new: true }, callback);
// };

// GuestUserSchema.set('toJSON', {
//     virtuals: true
// });

const Guest = mongoose.model("guestusers", GuestUserSchema);
module.exports = Guest;