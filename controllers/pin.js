const { Types } = require('aws-sdk/clients/acm');
const HttpStatus = require('http-status');
const { toArray } = require('lodash');

const errors = require('../errors');
const Pin = require('../models/pin');

//FIND THE EXISTING CATEGORY OF PRODUCTS
const findPin = async (req, res, next) => {
    let pin;
    try {
        pin = await Pin.findById(req.params.id).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }

    if (!pin) {
        return res.send({ message: req.t('Pin_Not_Found'), data: pin , status: 409, success: false })
        // return res.send(errors.pinNotFoundError);
    }

    return res.status(HttpStatus.OK).json({ pin, status: 200, success: true });
};

//ADD THE CATEGORY OF PRODUCTS
const addPin = async function (req, res, next) {
    const { title, pinName } = req.body;
    try {
        // const pinExist = await Pin.findOne({ title: { '$regex': new RegExp('^' + title.toLowerCase() + '$', "i") } });
        // if (pinExist) {
        //     return next(errors.pinTitleDuplicateError);
        // }
        const pin = new Pin(req.body);
        const savedPin = await pin.save();
        return res.send({ message: req.t('Pin_Added'), data: savedPin, status: 200, success: true });
    } catch (err) {
        return next(err);
    }
};

//DELETE THE CATEGORY OF PRODUCTS
const deletePin = async (req, res, next) => {
    let pin;
    const { id } = req.params;
    try {
        pin = await Pin.findByIdAndRemove(id);
    } catch (err) {
        return next(err);
    }

    return res.status(HttpStatus.OK).json({ message: req.t('Pin_Deleted'), data: pin, status: 200, success: true });
};

//LIST OF ALL CATEGORIES OF PRODUCTS(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const getAllPin = async (req, res, next) => {
    let pins;
    try {
        pins = await Pin
            .aggregate([
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $lookup: {
                        from: 'challenges',
                        localField: 'challengeId',
                        foreignField: '_id',
                        as: 'challenge'
                    }
                },
                {
                    $unwind:{path: '$challenge', preserveNullAndEmptyArrays: true}
                },
                {
                    $project: {
                        title:1,
                        pinType: 1,
                        pinImage: 1,
                        headLine: 1,
                        comment: 1,
                        lat_long: 1,
                        createdAt:1,
                        updatedAt:1,
                        challengeName: "$challenge.title",
                        pinName:1
                    }
                }
            ]).exec();
        totalCount = await Pin.countDocuments().exec()
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "All pins ", data: { pins, totalCount }, status: 200, success: true });
};

//UPDATE THE CATEGORY OF PRODUCTS
const updatePin = async function (req, res, next) {
    let pin;
    const { id } = req.params;
    const updates = req.body;
    try {
            // const pinExist = await Pin.findOne({ _id: { $ne: Types.ObjectId(id) }, Transport: { '$regex': new RegExp('^' + req.item.Transport.toLowerCase() + '$', "i") } });
            // if (pinExist) {
            //     return res.send({ message: 'The pin of similar title exist', status: 401, success: false })//
            // }
            pin = await Pin.findByIdAndUpdate(id, { $set: updates }, { new: true })
                .select('-__v')
                .exec();
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Pin_Updated'), data: pin, status: 200, success: true });
};

//FIND THE EXISTING CATEGORY OF PRODUCTS
const pinMap = async (req, res, next) => {
    let pin;
    try {
        pin = await Pin.find().select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }

    return res.status(HttpStatus.OK).json({ pin, status: 200, success: true });
};


module.exports = {
    findPin,
    addPin,
    deletePin,
    getAllPin,
    updatePin,
    pinMap
}