const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { head } = require('lodash');

const CountrySchema = new Schema({
    _id: {
        type: Number,
        unique: true
    },
    title: String,
    image: String,
    status: {
        type: Boolean,
        default: true
    },
    index: { type: Number, default: 1 }
}, {
    versionKey: false,
    timestamps: true
})

const getLastDocument = (Country) => Country.find({}).limit(1).sort({ _id: -1 }).exec();

// CountrySchema.pre('save', async function (next) { /* eslint-disable-line */
//     let lastDoc = await getLastDocument(this.constructor);
//     lastDoc = lastDoc ? head(lastDoc) : null;
//     this._id = lastDoc ? Number(lastDoc._id) + 1 : 1;
//     this.id = lastDoc ? Number(lastDoc.id) + 1 : 1;

//     return next();
// });

CountrySchema.pre('save', async function (next) { /* eslint-disable-line */
    if (this.title.toLowerCase() === "hong kong") {
        this._id = 1;
        this.id = 1;
    } else {
        let lastDoc = await getLastDocument(this.constructor);
        lastDoc = lastDoc ? head(lastDoc) : null;
        this._id = lastDoc ? Number(lastDoc._id) + 1 : 1;
        this.id = lastDoc ? Number(lastDoc.id) + 1 : 1;
    }
    return next();
});

const Country = mongoose.model('country', CountrySchema)
module.exports = Country;
