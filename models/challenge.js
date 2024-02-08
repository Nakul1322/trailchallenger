const { Types } = require("aws-sdk/clients/acm");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChallengeSchema = new Schema(
  {
    title: String,
    challengeType: {
      type: String,
      enum: ["Long Trail", "Day Hike", "Multi Part"],
    },
    colorGradient: [
      {
        type: String,
      },
    ],
    howItWorks: {
      type: String,
    },
    difficulty: {
      type: Number,
    },
    elevation: {
      type: Number,
    },
    distance: {
      type: Number,
    },
    price: {
      type: Number,
    },
    countryId: {
      type: Number,
      ref: "country",
      default: 1,
    },
    image: {
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
    howItWorksLink: {
      type: String,
      default: null,
    },
    withRedemption: {
      type: Boolean,
      default: false,
    },
    asSubChallenge: {
      type: Boolean,
      default: false,
    },
    route: {
      index: {
        type: Number,
        default: 0,
      },
      coordinates: [
        {
          latitude: { type: Number },
          longitude: { type: Number },
        },
      ],
    },
    isHide: {
      type: Boolean,
      default: false,
    },
    adminMapImage: {
      type: String,
      default: null,
    },
    subChallenge: [
      {
        type: Schema.Types.ObjectId,
        ref: "challenges",
        default: null,
      },
    ],
    multipartRoute: {
      type: Array,
      default: [],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// ChallengeSchema.index({ startPoint: "2dsphere" })
// ChallengeSchema.index({ endPoint: "2dsphere" })

const Challenge = mongoose.model("challenges", ChallengeSchema);
module.exports = Challenge;
