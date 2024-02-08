const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { head } = require('lodash');

const CategorySchema = new Schema({
    _id: {
        type: Number,
        unique: true
    },
    title: String,
    status:{
        type:Boolean,
        default: false
    },
    index: Number
}, {
    versionKey: false,
    timestamps: true
})

const getLastDocument = (Category) => Category.find({}).limit(1).sort({ _id: -1 }).exec();

CategorySchema.pre('save', async function (next) { /* eslint-disable-line */
    let lastDoc = await getLastDocument(this.constructor);
    lastDoc = lastDoc ? head(lastDoc) : null;
    this._id = lastDoc ? Number(lastDoc._id) + 1 : 1;
    this.id = lastDoc ? Number(lastDoc.id) + 1 : 1;

    return next();
});

const Category = mongoose.model('category', CategorySchema)
module.exports = Category;
