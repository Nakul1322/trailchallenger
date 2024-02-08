const HttpStatus = require('http-status');
const errors = require('../errors');
const GuestUser = require('../models/guestUser');
const { guestSignAccessToken } = require('../helpers/jwt_helper')
const { Types } = require('mongoose');
const Cart = require('../models/cart');
const RedeemUser = require('../models/redeemcodeuser')

//ADD A USER FROM ADMIN PANEL
const addGuestUser = async (req, res, next) => {
    let cartCount = 0;
    const { deviceId, deviceType } = req.body
    try {
        const guestUserExist = await GuestUser.findOne({ deviceId: req.body.deviceId });
        if (!guestUserExist) {
            const data = {
                deviceId,
                deviceType
            };
            const guestUser = new GuestUser(data);
            const savedGuestUser = await guestUser.save()
            return res.send({
                message: req.t('Welcome_Guest_User'), data: { savedGuestUser, cartCount: 0 }, status: 200, success: true
            })
        }
        const findCart = await Cart.findOne({ deviceId: deviceId }).exec();
        if (findCart) {
            cartCount = findCart.cartCount;
        }
        // const updateStatusReedeemCodeUsers = await RedeemUser.updateMany({}, { $set: { status: false } }, { new: true })
        return res.send({
            message: req.t('Welcome_Guest_User'), data: { guestUserExist, cartCount }, status: 200, success: true
        })
    }
    catch (err) {
        return next(err);
    }
};

//UPDATE GUEST USER DETAILS
const updateGuestUser = async function (req, res, next) {
    let guestUser;
    const { id } = req.params;
    const updates = req.body;
    try {
        guestUser = await GuestUser.findByIdAndUpdate(id, { $set: updates }, { new: true }).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }
    if (!guestUser) {
        return next(errors.userNotFoundError);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Profile_Updated'), data: guestUser, status: 200, success: true });
};

//LIST OF ALL GUEST USERS FOR ADMIN(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const guestUserList = async (req, res, next) => {
    let guestUsers;
    const { title } = req.query
    const filter = {};
    if (title) {
        filter['name'] = title;
    }
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 10;
    let skip = Number(page * pageSize)
    try {
        guestUsers = await GuestUser.aggregate([
            {
                $match: filter
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $lookup:
                {
                    from: 'challenges',
                    localField: 'challenges',
                    foreignField: '_id',
                    as: 'challenge'
                }
            },
            // {
            //     $unwind:'$challenge'
            // }
        ]).skip(skip).limit(Number(pageSize)).exec();
        totalCount = await GuestUser.countDocuments().exec()
    }
    catch (err) {
        return next(err);
    }
    if (!guestUsers) {
        return next(errors.userNotFoundError);
    }

    return res.status(HttpStatus.OK).json({ message: "Guest user list", data: { guestUsers, totalCount }, status: 200, success: true });
};

//UPDATE GUEST USER DETAILS
const removeGuestTrails = async function (req, res, next) {
    let removeGuestTrails;
    const { deviceId } = req.params;
    try {
        removeGuestTrails = await MyHike.findByIdAndUpdate(id, { $set: updates }, { new: true }).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }
    if (!guestUser) {
        return next(errors.userNotFoundError);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Profile_Updated'), data: guestUser, status: 200, success: true });
};

const appInfo = async function (req,res) {
    try {
        return res.send({ message: "Application Information", data: { androidAppVersion: process.env.APP_INFO }, status: 200, success: true });
    }
    catch (err) {
        return err;
    }
};

module.exports = {
    addGuestUser,
    updateGuestUser,
    guestUserList,
    appInfo
}
