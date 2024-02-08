const HttpStatus = require('http-status');
const { toArray } = require('lodash');

const errors = require('../errors');
const Country = require('../models/country');
const Challenge = require('../models/challenge');
const User = require('../models/user')
const GuestUser = require('../models/guestUser')
const { Types } = require('mongoose');

//FIND THE EXISTING CATEGORY OF PRODUCTS
const findCountry = async (req, res, next) => {
    let country;
    try {
        country = await Country.findById(req.params.id).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }

    if (!country) {
        return res.send(errors.countryNotFoundError);
    }

    return res.status(HttpStatus.OK).json({ country, status: 200, success: true });
};

//ADD THE CATEGORY OF PRODUCTS
const addCountry = async function (req, res, next) {
    const { title } = req.item;
    try {
        const countryExist = await Country.findOne({ title: { '$regex': new RegExp('^' + title.toLowerCase() + '$', "i") } });
        if (countryExist) {
            return next(errors.countryTitleDuplicateError);
        }
        const country = new Country(req.item);
        const savedCountry = await country.save();
        return res.send({ message: req.t('Country_Added'), data: savedCountry, status: 200, success: true });
    } catch (err) {
        return next(err);
    }
};

//DELETE THE CATEGORY OF PRODUCTS
const deleteCountry = async (req, res, next) => {
    let country;
    const { id } = req.params;
    try {
        const countryStatus = await Country.findById(id)
        if (countryStatus.status == false) {
            country = await Country.findByIdAndRemove(id);
            return res.send({ message: req.t('Country_Deleted'), data: country, status: 200, success: true });
        }
        const productCountryExists = await Challenge.exists({ countryId: id });
        if (productCountryExists) {
            return res.send({ message: req.t('Country_Exist'), data: {}, status: 401, success: false });
            // return next(errors.productCountryExistsError);
        }
        country = await Country.findByIdAndRemove(id);
    } catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Country_Deleted'), data: country, status: 200, success: true });
};

//LIST OF ALL CATEGORIES OF PRODUCTS(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const getAllCountry = async (req, res, next) => {
    let categories;
    // const { date } = req.body;
    const countryFilter = {}
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 10;
    let skip = Number(page * pageSize)
    try {
        categories = await Country
            .aggregate([
                {
                    $match: countryFilter
                },
                {
                    $sort: { index: 1 }
                },
                {
                    $lookup: {
                        from: 'challenges',
                        localField: '_id',
                        foreignField: 'countryId',
                        as: 'challenges'
                    }
                },
                {
                    $project: {
                        title: 1,
                        status: 1,
                        createdAt: 1,
                        index: 1,
                        image: 1,
                        count: { $add: [{ $size: '$challenges' }] }
                    }
                }
            ]).skip(skip).limit(Number(pageSize)).exec();
        totalCount = await Country.countDocuments().exec()
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "All categories ", data: { categories, totalCount }, status: 200, success: true });
};

//UPDATE THE CATEGORY OF PRODUCTS
const updateCountry = async function (req, res, next) {
    let country;
    const { id } = req.params;
    const updates = req.item;
    const { status } = req.body
    try {
        if (status != null) {
            country = await Country.findByIdAndUpdate(id, { $set: { status: status } }, { new: true })
        }
        else {
            const countryExist = await Country.findOne({ _id: { $ne: Number(id) }, title: { '$regex': new RegExp('^' + req.item.title.toLowerCase() + '$', "i") } });
            if (countryExist) {
                return res.send({ message: 'The country of similar title exist', status: 401, success: false })//
                // return next(errors.countryTitleDuplicateError);
            }
            country = await Country.findByIdAndUpdate(id, { $set: updates }, { new: true })
                .select('-__v')
                .exec();
        }
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Country_Updated'), data: country, status: 200, success: true });
};

const updateSortCountry = async function (req, res, next) {
    let country;
    const { countryList } = req.body;
    try {
        const countryArray = toArray(countryList)
        const sortedData = countryArray.sort((a, b) => Number(a._id) - Number(b._id))
        const deletePreviousCountry = await Country.deleteMany({});
        for (var i = 0; i < sortedData.length; i++) {
            country = new Country(sortedData[i]);
            await country.save()
        }
    }
    catch (err) {
        return next(err);
    }

    return res.status(HttpStatus.OK).json({ message: req.t('Country_Order'), data: {}, status: 200, success: true });
};

const updateStatusOfCountry = async function (req, res, next) {
    let updateUserCountry;
    const { userId, deviceId, countryId } = req.body;
    try {
        if (userId) {
            updateUserCountry = await User.findOneAndUpdate({ userId: Types.ObjectId(userId) }, { $set: { countryId: countryId } }, { new: true }).exec()
        }
        if (deviceId) {
            updateUserCountry = await GuestUser.findOneAndUpdate({ deviceId: deviceId }, { $set: { countryId: countryId } }, { new: true }).exec()
        }
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Country_Updated'), data: updateUserCountry, status: 200, success: true });
}

module.exports = {
    findCountry,
    addCountry,
    deleteCountry,
    getAllCountry,
    updateCountry,
    updateSortCountry,
    updateStatusOfCountry
}