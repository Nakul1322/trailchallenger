const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs')

const UserSchema = new Schema({
    name: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    photo: {
        type: String,
        default: null,
        set: function (value) {
            // if the value of pinImage starts with https://trailchalleger.s3.ap-south-1.amazonaws.com/,
            // return it as is, otherwise add the prefix
            if (value && !value.startsWith('https://')) {
                value = 'https://trailchalleger.s3.ap-south-1.amazonaws.com/' + value;
            }
            return value;
        }
    },
    phone: {
        type: String,
        default: "1234567890"
    },
    // address: {
    //     type: String,
    //     default:""
    // },
    language: {
        type: String,
        enum: ['English', 'Chinese'],
        default: 'English'
    },
    status: {
        type: String,
        enum: ['Active', 'Pending', 'Deleted'],
        default: 'Pending'
    },
    challenge: [{
        type: Schema.Types.ObjectId,
        ref: 'challenges'
    }],
    signUpLoc: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
    },
    completionTime: {
        type: Number
    },
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'orders'
    },
    isAdmin:
    {
        type: Boolean,
        default: false
    },
    inAppNotification:
    {
        type: Boolean,
        default: true
    },
    notificationToMyPost:
    {
        type: Boolean,
        default: true
    },
    optOutCommunication:
    {
        type: Boolean,
        default: false
    },
    phone: {
        type: String,
        default: null
    },
    deviceId: {
        type: String,
        default: null
    },
    deviceToken: {
        type: String,
        default: null
    },
    deviceType: {
        type: Number,
        enum: [{ Android: 0, Iphone: 1 }],
        default: 1
    },
    countryId: {
        type: Number,
        ref: 'country',
        default: 1
    },
    favorites: [{
        type: Schema.Types.ObjectId,
        ref: 'myhikes'
    }],
}, {
    versionKey: false,
    timestamps: true
});

UserSchema.pre('save', async function (next) {
    try {
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(this.password, salt)
        this.password = hashedPassword
        next()

    } catch (error) {
        next(error)
    }

})

UserSchema.methods.isValidPassword = async function (password) {
    try {
        return await bcrypt.compare(password, this.password)
    } catch (error) {
        throw error
    }
}

const User = mongoose.model('user', UserSchema)
module.exports = User;