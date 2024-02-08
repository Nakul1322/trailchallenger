const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommunitySchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    content: {
        type: String,
    },
    totalComment: {
        type: Number,
        default: 0
    },
    img:[{
        type: String,
        default:null,
        set: function (value) {
            // if the value of pinImage starts with https://trailchalleger.s3.ap-south-1.amazonaws.com/,
            // return it as is, otherwise add the prefix
            if (value && !value.startsWith('https://')) {
                value = 'https://trailchalleger.s3.ap-south-1.amazonaws.com/' + value;
            }
            return value;
        }
    }],
    totalLikes:{
        type: Number,
        default: 0
    },
    postType:{
        type: Number,
        enum: [{AdminText:1,textOnly:2,textWithPic:3, AdminTextWithPic:4, challengePost :5}],
    },
    trailName:{
        type: String,
        default:null
    }
    // trailId:{
    //     type: Schema.Types.ObjectId,
    //     ref: "challenges"
    // },
    // communityPostType:{
    //     type: Number,
    //     enum: [{communityPost:0,challengePost:1,adminPost:2}],
    //     default:2
    // }
    },
    {
        timestamps: true
    });

const Community = mongoose.model("community", CommunitySchema);
module.exports = Community;