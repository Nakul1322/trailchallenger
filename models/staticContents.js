const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const staticcontentsSchema = new mongoose.Schema({
    variable: {
        type: String,
        trim: true,
        required: [true, 'Variable is required.'],
    },
    page_title: {
        type: String,
        trim: true,
        required: [true, 'Title is required.'],
    },
    description : {
        type: String,
        trim: true,
        required: [true, 'Description is required.'],
    },
    status: {
        type: Number,
        trim: true,
        default: 1 //active->1, inactive->0 
    },
    isDelete: {
        isDelete: {
            type: Boolean,
            default: false
        },
        deletedAt: {
            type: Date, 
            default: null
        }
    }
}, { timestamps: true, strict: true })

staticcontentsSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = { 
    Staticcontents : mongoose.model('staticcontents', staticcontentsSchema), 
    ObjectId 
}
