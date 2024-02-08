const mongoose = require("mongoose");
const Float = require('mongoose-float').loadType(mongoose);
const Schema = mongoose.Schema;

const MyHikeSchema = new Schema({
    deviceId: {
        type: String,
        default: null
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    trailId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    startTime: {
        type: Date,
        default: null
    },
    endTime: {
        type: Date,
        default: null
    },
    route: {
        index: {
            type: Number,
            default: 0
        },
        coordinates: [{
            latitude: { type: Number },
            longitude: { type: Number },
        }]
    },
    lastTime: {
        type: Date,
        default: Date.now()
    },
    lastCoordinate: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    currentDistance: {
        type: Float,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
    completionPercentage: {
        type: Float,
        default: 0
    },
    challengeType: {
        type: String,
        default: null
    },
    duration: {
        type: Number,
        default: 0
    },
    traveledPath: [{
        startCoordinate: {
            latitude: { type: Number, default: null },
            longitude: { type: Number, default: null },
        },
        lastCoordinate: {
            latitude: { type: Number, default: null },
            longitude: { type: Number, default: null },
        },
        distanceCovered: { type: Float, default: null },
        orderIndex:{type: Number},
        startTime: {
            type: Date,
            default: null
        },
        endTime: {
            type: Date,
            default: null
        },
        duration:{
            type: Number,
            default: 0
        }
    }],
    pendingPath: [{
        startCoordinate: {
            latitude: { type: Number, default: null },
            longitude: { type: Number, default: null },
        },
        lastCoordinate: {
            latitude: { type: Number, default: null },
            longitude: { type: Number, default: null },
        },
        distanceCovered: { type: Number, default: null },
        orderIndex:{type: Number},
        startTime: {
            type: Date,
            default: null
        },
        endTime: {
            type: Date,
            default: null
        },
    }],
    userMapImage: {
        type: String,
        default: null
    },
    isSponsored:{
        type: Boolean,
        default: true
    },
    rank: {
        type: Number,
        default: 0
    }
},
    {
        timestamps: true
    });

const MyHike = mongoose.model("myhikes", MyHikeSchema);
module.exports = MyHike