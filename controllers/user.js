const HttpStatus = require('http-status');

const errors = require('../errors');
const User = require('../models/user');
const Cart = require('../models/cart');
const Shipping = require('../models/shipping')
const PaymentRecord = require("../models/newpaymentmodel")
const RedeemMedal = require('../models/redeemmedal');
const MyHike = require('../models/myhikes')
const bcrypt = require('bcryptjs');
const { signAccessToken } = require('../helpers/jwt_helper')
const { Types } = require('mongoose');
const { head } = require('lodash');
const { sign } = require('crypto');

//ADD A USER FROM ADMIN PANEL
const addUser = async (req, res, next) => {
    const { firstName, lastName, email, phone, image, optOutCommunication, password, address } = req.body
    const userExist = await User.findOne({ "email": { $regex: new RegExp(email, "i") } });
    if (userExist && userExist.status !== "Deleted") {
        return res.send(errors.userExistsError);
    }
    try {
        const data = {
            name: firstName + " " + lastName,
            email,
            password,
            isVerified: true,
            isAdmin: false,
            phone,
            status: "Active",
            photo: image,
            optOutCommunication
        };
        const user = new User(data);
        const savedUser = await user.save()
        const shippingDataRecord = {
            userId: Types.ObjectId(savedUser._id),
            name:firstName + " " + lastName,
            email,
            phone,
            address,
        }
        const shippingRecord = new Shipping(shippingDataRecord);
        const savedCategory = await shippingRecord.save();
        const accessToken = await signAccessToken(user.id);
        return res.send({
            message: req.t('User_Added'), data: { accessToken, user }, status: 200, success: true
        })
    }
    catch (err) {
        return next(err);
    }
};

//GET THE USER DETAILS BASED ON USER_ID
const getUserData = async (req, res, next) => {
    let user, cart;
    try {
        cart = await Cart.findOne({ userId: req.params.id }).exec();
        user = await User.aggregate([
            {
                $match: { _id: Types.ObjectId(req.params.id) }
            },
            {
                $lookup:
                {
                    from: 'shippings',
                    let: { userId: "$_id" },
                    pipeline: [{ $match: { $expr: { $eq: ["$userId", "$$userId"] } } },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $limit: 1
                    },
                    {
                        $project: {
                            _id: 0,
                            address: 1,
                        }
                    }],
                    as: 'shipping'
                }
            },
            { $unwind: { path: "$shipping", preserveNullAndEmptyArrays: true } },
            {
                $lookup:
                {
                    from: 'carts',
                    let: { userId: "$_id" },
                    pipeline: [{ $match: { $expr: { $eq: ["$userId", "$$userId"] } } }, {
                        $project: {
                            _id: 0,
                            cartCount: 1,
                        }
                    }],
                    as: 'carts'
                }
            },
            { $unwind: { path: "$carts", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    "_id": 1,
                    "name": 1,
                    "email": 1,
                    "password": 1,
                    "isVerified": 1,
                    "photo": 1,
                    "phone": 1,
                    "language": 1,
                    "status": 1,
                    "challenge": 1,
                    "isAdmin": 1,
                    "inAppNotification": 1,
                    "notificationToMyPost": 1,
                    "optOutCommunication": 1,
                    "createdAt": 1,
                    "updatedAt": 1,
                    "cartCount": "$carts.cartCount",
                    "address": {
                        $ifNull: ["$shipping.address", null]
                    },
                    "deviceId": 1
                }
            }
        ])
        user = head(user)

    }
    catch (err) {
        return next(err);
    }

    if (!user) {
        return next(errors.userNotFoundError);
    }
    if (!cart) {
        user.cartCount = 0
        return res.status(HttpStatus.OK).json({ message: "User Data", data: { user }, status: 200, success: true });
    }
    return res.status(HttpStatus.OK).json({ message: "User Data", data: { user }, status: 200, success: true });
};

//LIST OF ALL USERS FOR ADMIN(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const getAllUsers = async (req, res, next) => {
    let users, totalCount;
    const { title } = req.query
    let filter = { isAdmin: { $ne: true } };
    if (title) {
        filter = {
            $or: [
                { name: { $regex: new RegExp(title, "i") } },
                { email: { $regex: new RegExp(title, "i") } }
            ]
        }
    }
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 100;
    let skip = Number(page * pageSize)
    console.log(skip, page, pageSize)
    try {
        users = await User.aggregate([
            {
                $match: filter
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $lookup:
                {
                    from: 'orders',
                    let: { userId: "$_id" },
                    pipeline: [{ $match: { $expr: { $eq: ["$userId", "$$userId"] } } }, {
                        $project: {
                            _id: 1,
                            title: 1,
                            products: 1,
                            paymentMethod: 1,
                            amount: 1,
                            totalOrder: {
                                $size: {
                                    $cond: [
                                        { "$isArray": "$products" },
                                        "$products",
                                        []
                                    ]
                                }
                            }
                        }
                    }],
                    as: 'orderId'
                }
            },
            {
                $lookup:
                {
                    from: 'paymentrecords',
                    let: { userId: "$_id" },
                    pipeline: [{ $match: { $expr: { $eq: ["$userId", "$$userId"] } } },
                    {
                        $count: 'payment'
                    }
                    ],
                    as: 'payment'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    password: 1,
                    isVerified: 1,
                    photo: 1,
                    phone: 1,
                    language: 1,
                    status: 1,
                    challenge: 1,
                    isAdmin: 1,
                    inAppNotification: 1,
                    notificationToMyPost: 1,
                    optOutCommunication: 1,
                    deviceId: 1,
                    deviceToken: 1,
                    deviceType: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    orderId: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$orderId", []] }, then: 0 },
                                { case: { $ne: ["$orderId", []] }, then: '$orderId' }
                            ],
                        },
                    },
                    purchase: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$payment", []] }, then: [0] },
                                { case: { $ne: ["$payment", []] }, then: '$payment.payment' }
                            ],
                        },
                    }
                }
            },
            { $unwind: "$purchase" }
        ]).skip(skip).limit(Number(pageSize)).exec();
        if (title) {
            totalCount = users.length;
        }
        else {
            totalCount = await User.countDocuments().exec() - 1;
        }
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "User list", data: { users, totalCount }, status: 200, success: true });
};

const userListInNotification = async (req, res, next) => {
    let users, totalCount;
    const { title, userId, email } = req.query
    let filter = { inAppNotification: true, status: { $ne: "Blocked" }, isAdmin: { $ne: true } };
    if (title) {
        filter['name'] = { $regex: new RegExp(title, "i") };
    }
    if (userId) {
        filter['_id'] = Types.ObjectId(userId);
    }
    if (email) {
        filter['email'] = { $regex: new RegExp(email, "i") };
    }
    console.log(filter)
    // let { page, pageSize } = req.query;
    // page = page || 0;
    // pageSize = pageSize || 100;
    // let skip = Number(page * pageSize)
    try {
        users = await User.aggregate([
            {
                $match: filter
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $project: {
                    name: 1,
                }
            }
        ])
        // .skip(skip).limit(Number(pageSize)).exec();
        if (title || userId || email) {
            totalCount = users.length;
        }
        else {
            totalCount = await User.countDocuments().exec() - 1;
        }
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "User list", data: { users, totalCount }, status: 200, success: true });
};

//UPDATE USER DETAILS
const updateUserData = async function (req, res, next) {
    let user, updateShippingAddress;
    const { id } = req.params;
    let { name, email, photo, language, challenge, inAppNotification, notificationToMyPost, optOutCommunication, status, isVerified, address, phone } = req.body;
    // city, country, line1, postal_code, state
    // const updates = req.item;
    try {
        // const address = {
        //     city: city,
        //     country: country,
        //     line1: country,
        //     postal_code: "0000",
        //     state: country
        // }
        if (photo == '<null>') {
            photo = null
        }
        user = await User.findByIdAndUpdate(id, { $set: { name, email, photo, language, inAppNotification, notificationToMyPost, optOutCommunication, challenge, isVerified, status, phone } }, { new: true })
            .select('-__v')
            .exec();
        const findLastAddress = await Shipping.find({ userId: Types.ObjectId(id) }).sort({ createdAt: -1 }).limit(1).exec();
        console.log(findLastAddress)
        if (findLastAddress.length > 0) {
            const findLastAddressId = findLastAddress[0]._id;
            updateShippingAddress = await Shipping.findByIdAndUpdate(findLastAddressId, { $set: { address, phone } }, { new: true }).exec();
        }
        if (address && !(address === null)) {
            if (findLastAddress.length == 0) {
                const shippingDataRecord = {
                    userId: Types.ObjectId(id),
                    name,
                    email,
                    phone,
                    address
                }
                const shippingRecord = new Shipping(shippingDataRecord);
                const savedCategory = await shippingRecord.save();
            }
        }
    }
    catch (err) {
        return next(err);
    }

    if (!user) {
        return next(errors.userNotFoundError);
    }

    return res.status(HttpStatus.OK).json({ message: req.t('Profile_Updated'), data: user, status: 200, success: true });
};

//DELETE USER FOR THE ADMIN
const removeUser = async function (req, res, next) {
    let user;
    const { id } = req.params;
    try {
        user = await User.findByIdAndRemove(id);
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t("Profile_Deleted"), data: {}, status: 200, success: true });
};

//BLOCK USER FOR THE ADMIN
const blockUser = async function (req, res, next) {
    let user;
    const { id } = req.params;
    const { status } = req.body;
    try {
        if (status === "Blocked") {
            user = await User.findByIdAndUpdate(id, { $set: { status: 'Blocked', isVerified: false } }, { new: true });
            return res.send({ message: req.t('User_Blocked'), data: user, status: 200, success: true })
        }
        else {
            user = await User.findByIdAndUpdate(id, { $set: { status: 'Active', isVerified: true } }, { new: true });
            return res.send({ message: req.t('User_Unblocked'), data: user, status: 200, success: true })
        }
    }
    catch (err) {
        return next(err);
    }
};

//CHANGE THE USER PASSWORD
const changePassword = async function (req, res, next) {
    let userRecord;
    const { id } = req.params;
    const { existingpassword } = req.body;
    let password = req.body.newpassword;
    try {
        const user = await User.findById(id);
        if (user.status === "Blocked") {
            return res.status(402).json({ message: req.t('User_Blocked'), status: 204, success: false });
            //return res.send(errors.userBlockedError)
        }
        if (user.status === "Deleted") {
            return res.status(402).json({ message: req.t('User_Deleted'), status: 204, success: false });
        }
        const isMatch = await user.isValidPassword(existingpassword);
        if (!isMatch) {
            return res.status(200).json({ message: req.t('Password_Not_Matched'), status: 200, success: false });
        }
        const isPasswordMatch = await user.isValidPassword(password);
        if (isPasswordMatch) {
            return res.status(200).json({ message: req.t('Password_Match_Error'), status: 200, success: false });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        password = hashedPassword;
        userRecord = await User.findByIdAndUpdate(id, { password }, { new: true })
            .select('-__v')
            .exec();
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t("Password_Updated"), data: userRecord, status: 200, success: true });
};

//CHANGE ADMIN PROFILE FOR THE ADMIN 
const changeAdminProfile = async function (req, res, next) {
    let adminRecord;
    const { id } = req.params;
    const { existingpassword, newpassword } = req.body;
    let password = newpassword;
    try {
        const user = await User.findById(id);
        if (existingpassword) {
            if (existingpassword !== null) {
                const isMatch = await user.isValidPassword(existingpassword);
                if (!isMatch) {
                    return res.status(200).json({ message: req.t('Password_Not_Matched'), status: 200, success: false });
                }
                const isPasswordMatch = await user.isValidPassword(password);
                if (isPasswordMatch) {
                    return res.status(200).json({ message: req.t('Password_Match_Error'), status: 200, success: false });
                }
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                password = hashedPassword;
                adminRecord = await User.findByIdAndUpdate(id, { password }, { new: true }).select('-__v').exec();
            }
        }
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "Admin password updated successfully", data: adminRecord, status: 200, success: true });
}

//ADD A NEW USER AFTER BUYING A CHALLENGE
const userDetails = async (req, res, next) => {
    let { name, address, email, phone, password, photo, signUpLoc } = req.body
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        password = hashedPassword;
        let data = {
            name,
            email,
            address,
            password: password,
            isVerified: true,
            isAdmin: false,
            phone: phone,
            status: "Active",
            photo: photo,
            signUpLoc
        };
        const user = new User(data);
        await user.save()
        const accessToken = await signAccessToken(user.id);
        return res.send({
            message: "User is being Registered", data: { accessToken, user }, status: 200, success: true
        })
    }
    catch (err) {
        return next(err);
    }
}

const userDigitalPurchaseList = async (req, res, next) => {
    let { id } = req.params
    let digitalList;
    try {
        digitalList = await PaymentRecord.aggregate([
            {
                $match: {
                    "userId": Types.ObjectId(id),
                    'trails': { $ne: null }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $unwind: { path: '$trails', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: 'myhikes',
                    localField: 'hikeId',
                    foreignField: '_id',
                    as: 'myhike'
                }
            },
            {
                $unwind: { path: '$myhike', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup:
                {
                    from: 'redeemmedals',
                    let: { trailId: "$trails.trailId" },
                    pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$trailId", "$$trailId"] }, { $eq: ["$userId", Types.ObjectId(id)] }] } } },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $project: {
                            isRedeemed: '$isRedeemed'
                        },
                    }
                    ],
                    as: 'medals'
                }
            },
            {
                $project: {
                    userId: 1,
                    products: 1,
                    paymentStatus: 1,
                    paymentType: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    completionPercentage: "$myhike.completionPercentage",
                    duration: "$myhike.duration",
                    trailName: "$trails.trailName",
                    trailId: "$trails.trailId",
                    isRedeemed: 1,
                    hikeId: 1
                }
            }
        ]).exec()
        return res.send({
            message: "User's purchase list", data: { digitalList }, status: 200, success: true
        })
    }
    catch (err) {
        return next(err);
    }
}

const userPhysicalPurchaseList = async (req, res, next) => {
    let physicalList;
    let { id } = req.params
    try {
        physicalList = await PaymentRecord.aggregate([
            {
                $match: {
                    $and: [
                        { "userId": Types.ObjectId(id) },
                        { 'products': { $ne: null } }
                    ]
                }
            },
            {
                $unwind: '$products'
            }
        ]).exec()
        return res.send({
            message: "User's physical purchase list", data: { physicalList }, status: 200, success: true
        })
    }
    catch (err) {
        return next(err);
    }
}

const updateDigitalPurchase = async function (req, res, next) {
    let purchase;
    const { userId, trailId } = req.body;
    try {
        purchase = await PaymentRecord.findOneAndUpdate({ $and: [{ 'userId': Types.ObjectId(userId) }, { trails: { $elemMatch: { 'trailId': Types.ObjectId(trailId) } } }] }, { $set: { isRedeemed: true } }, { new: true }).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "status updated successfully", data: { isRedeemed: purchase.isRedeemed }, status: 200, success: true });
};

const updatePhysicalPurchase = async function (req, res, next) {
    let purchase;
    const { productId, isRedeemed } = req.body;
    const { id } = req.params;
    try {
        if (isRedeemed == true) {
            purchase = await PaymentRecord.findOneAndUpdate({ _id: Types.ObjectId(id), products: { $elemMatch: { productId: Types.ObjectId(productId) } } }, {
                '$set': {
                    'products.$.isRedeemed': true
                }
            }, { new: true }).select('-__v').exec();
        }
        if (isRedeemed == false) {
            purchase = await PaymentRecord.findOneAndUpdate({ _id: Types.ObjectId(id), products: { $elemMatch: { productId: Types.ObjectId(productId) } } }, {
                '$set': {
                    'products.$.isRedeemed': false
                }
            }, { new: true }).select('-__v').exec();
        }
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "status updated successfully", data: {}, status: 200, success: true });
};

//FILTER API FOR USER LIST
const filterListPurchase = async function (req, res, next) {
    let users, totalCount;
    try {
        users = await User.aggregate([
            {
                $lookup:
                {
                    from: 'paymentrecords',
                    let: { userId: "$_id" },
                    pipeline: [{ $match: { $expr: { $eq: ["$userId", "$$userId"] } } },
                    {
                        $count: 'payment'
                    }
                    ],
                    as: 'payment'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    password: 1,
                    photo: 1,
                    phone: 1,
                    optOutCommunication: 1,
                    purchase: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$payment", []] }, then: [0] },
                                { case: { $ne: ["$payment", []] }, then: '$payment.payment' }
                            ],
                        },
                    }
                }
            },
            { $unwind: "$purchase" },
            {
                $match: {
                    purchase: { $ne: 0 }
                }
            },
            {
                $sort: { purchase: -1 }
            },
        ]).exec()
        totalCount = users.length
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "Filtered list", data: { users, totalCount }, status: 200, success: true });
};

//FILTER API FOR USER LIST
const filterListOptIn = async function (req, res, next) {
    let users, totalCount;
    try {
        users = await User.aggregate([
            {
                $sort: {
                    optOutCommunication: 1
                }
            },
            {
                $lookup:
                {
                    from: 'paymentrecords',
                    let: { userId: "$_id" },
                    pipeline: [{ $match: { $expr: { $eq: ["$userId", "$$userId"] } } },
                    {
                        $count: 'payment'
                    }
                    ],
                    as: 'payment'
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    password: 1,
                    photo: 1,
                    phone: 1,
                    optOutCommunication: 1,
                    purchase: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$payment", []] }, then: [0] },
                                { case: { $ne: ["$payment", []] }, then: '$payment.payment' }
                            ],
                        },
                    }
                }
            },
            { $unwind: "$purchase" },
        ]).exec()
        totalCount = await User.countDocuments().exec()
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "Filtered list", data: { users, totalCount }, status: 200, success: true });
};

const allUserLocation = async function (req, res, next) {
    let location;
    try {
        location = await User.find({ signUpLoc: { $exists: true } }).select({ signUpLoc: 1, name: 1, email: 1 }).exec()
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "All users sign up location", data: location, status: 200, success: true });
};

module.exports = {
    getUserData,
    getAllUsers,
    updateUserData,
    removeUser,
    changeAdminProfile,
    blockUser,
    addUser,
    changePassword,
    userDetails,
    userDigitalPurchaseList,
    userPhysicalPurchaseList,
    updateDigitalPurchase,
    updatePhysicalPurchase,
    filterListPurchase,
    filterListOptIn,
    userListInNotification,
    allUserLocation
}