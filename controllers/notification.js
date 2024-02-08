const HttpStatus = require('http-status');
const errors = require('../errors');
const Notification = require('../models/notification');
const { sendForAndroid, sendForIOS } = require('../helpers/sendnotification')
const { Types } = require('mongoose');
const GuestUser = require('../models/guestUser');
const User = require('../models/user');
const { userDigitalPurchaseList } = require('./user');
const { head } = require('lodash');

//FIND THE NOTIFICATION MESSAGE BASED ON NOTIFICATION_ID
const findNotification = async (req, res, next) => {
    let notification;
    try {
        notification = await Notification.findById(req.params.id).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }

    if (!notification) {
        return res.send(errors.notificationNotFoundError);
    }
    return res.status(HttpStatus.OK).json({ message: "Find notification", data: notification, status: 200, success: true });
};

//FIND THE NOTIFICATION MESSAGE
const updateNotification = async function (req, res, next) {
    let notification;
    const { id } = req.params;
    const updates = req.item;
    try {
        notification = await Notification.findByIdAndUpdate(id, { $set: updates }, { new: true }).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }

    if (!notification) {
        return res.send(errors.notificationNotFoundError);
    }
    return res.status(HttpStatus.OK).json({ message: "Notification updated successfully", data: notification, status: 200, success: true });
};

//ADD THE NOTIFICATION MESSAGE
const addNotification = async function (req, res, next) {
    let findIphoneUsers, findAndroidUsers, notificationUserData, mongoUserId = [], deviceTokenIOS, deviceTokenAndroid, pushNotificationForIOS, pushNotificationForAndroid;
    const { notificationMessage, userId, allUsers } = req.body;
    const chunkSize = 50;
    try {
        if (allUsers == true) {
            notificationUserData = {
                notificationMessage,
                userId: [],
                allUsers: true
            }
            console.log(mongoUserId);
            const notification = new Notification(notificationUserData);
            const savedNotification = await notification.save();
            const allUserIds = await User.find({}, { _id: 1 }).exec()
            allUserIds.map(function (obj) {
                mongoUserId.push(obj._id);
            });
            for (let i = 0; i < mongoUserId.length; i += chunkSize) {
                const chunk = mongoUserId.slice(i, i + chunkSize);
                findIphoneUsers = await User.find({ _id: { $in: chunk }, deviceType: 1 }).exec()
                if (findIphoneUsers.length != 0) {
                    const iphoneUsers = []
                    findIphoneUsers.map(function (obj) {
                        iphoneUsers.push(obj.deviceToken);
                    });
                    deviceTokenIOS = findIphoneUsers.map(x => x.deviceToken)
                    let sendPushNotificationIOS = {
                        deviceToken: deviceTokenIOS,
                        message: notificationMessage,
                        type: "1",
                        data: 'Admin push notification',
                    }
                    pushNotificationForIOS = await sendForIOS(sendPushNotificationIOS)
                }
                findAndroidUsers = await User.find({ _id: { $in: chunk }, deviceType: 0 }).exec()
                if (findAndroidUsers.length != 0) {
                    console.log(findAndroidUsers)
                    const androidUsers = []
                    findAndroidUsers.map(function (obj) {
                        androidUsers.push(obj.deviceToken);
                    });
                    deviceTokenAndroid = findAndroidUsers.map(x => x.deviceToken)
                    let sendPushNotificationAndroid = {
                        deviceToken: deviceTokenAndroid,
                        message: notificationMessage,
                        type: "1",
                        data: "Admin push notification",
                    }
                    pushNotificationForAndroid = await sendForAndroid(sendPushNotificationAndroid)
                }
            }
            return res.send({ message: "Notification added successfully", data: savedNotification, status: 200, success: true });
        }
        else {
            notificationUserData = {
                notificationMessage,
                userId: userId,
                allUsers: false
            }
            const notification = new Notification(notificationUserData);
            const savedNotification = await notification.save();
            mongoUserId = userId.map(id => Types.ObjectId(id));
            findIphoneUsers = await User.find({ _id: { $in: mongoUserId }, deviceType: 1 }).exec()
            console.log(findIphoneUsers)
            if (findIphoneUsers.length != 0) {
                console.log(findIphoneUsers)
                const iphoneUsers = []
                findIphoneUsers.map(function (obj) {
                    iphoneUsers.push(obj.deviceToken);
                });
                console.log(iphoneUsers)
                deviceTokenIOS = findIphoneUsers.map(x => x.deviceToken)
                let sendPushNotificationIOS = {
                    deviceToken: deviceTokenIOS,
                    message: notificationMessage,
                    type: "1",
                    data: 'Admin push notification',
                }
                console.log(sendPushNotificationIOS)
                pushNotificationForIOS = await sendForIOS(sendPushNotificationIOS)
            }
            findAndroidUsers = await User.find({ _id: { $in: mongoUserId }, deviceType: 0 }).exec()
            if (findAndroidUsers.length != 0) {
                console.log(findAndroidUsers)
                const androidUsers = []
                findAndroidUsers.map(function (obj) {
                    androidUsers.push(obj.deviceToken);
                });
                console.log(androidUsers)
                deviceTokenAndroid = findAndroidUsers.map(x => x.deviceToken)
                console.log(deviceTokenAndroid)
                let sendPushNotificationAndroid = {
                    deviceToken: deviceTokenAndroid,
                    message: notificationMessage,
                    type: "1",
                    data: "Admin push notification",
                }
                console.log(sendPushNotificationAndroid)
                pushNotificationForAndroid = await sendForAndroid(sendPushNotificationAndroid)
            }
            return res.send({ message: "Notification added successfully", data: savedNotification, status: 200, success: true });
        }
    } catch (err) {
        return next(err);
    }
};

//DELETE THE NOTIFICATION MESSAGE
const deleteNotification = async (req, res, next) => {
    let data;
    const { id, userId } = req.params;
    try {
        console.log(userId, id);
        if (userId == "all user") {
            data = await Notification.findByIdAndRemove(id).exec();
        }
        else {
            data = await Notification.findByIdAndUpdate(
                { _id: Types.ObjectId(id) },
                {
                    $pull: { "userId": { $in: [Types.ObjectId(userId)] } }
                }).exec();
            const nullData = await Notification.deleteMany({ allUsers: false, userId: { $size: 0 } })
        }
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "Notification deleted successfully", data, status: 200, success: true });
};

//LIST OF ALL NOTIFICATION MESSAGES(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const getAllNotification = async (req, res, next) => {
    let notificationList;
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 10;
    let skip = Number(page * pageSize)
    try {
        notificationList = await Notification.aggregate([
            {
                $sort: { createdAt: -1 }
            },
            {
                $lookup:
                {
                    from: 'users',
                    let: { userId: "$userId" },
                    pipeline: [{ $match: { $expr: { $in: ["$_id", "$$userId"] } } },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $project: {
                            userId: '$_id',
                            userPhoto: '$photo',
                            name: '$name',
                            email: '$email'
                        },
                    }
                    ],
                    as: 'user'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    notificationMessage: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    user: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$user", []] }, then: [{ 'name': 'All Users', 'userId': 'all user' }] },
                                { case: { $ne: ["$user", []] }, then: '$user' }
                            ],
                        },
                    }
                },
            },
            {
                $unwind: '$user'
            }
        ]).skip(skip).limit(Number(pageSize)).exec();
        const countDocs = await Notification.countDocuments()
        if (countDocs == 0) {
            totalCount = 0;
        }
        else {
            let totalCountArray = await Notification.aggregate([
                { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } }, //},
                { $group: { _id: null, count: { $sum: 1 } } }
            ]).exec()
            totalCountArray = head(totalCountArray)
            totalCount = totalCountArray.count
            console.log(totalCount)
        }
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "All notification", data: { notificationList, totalCount}, status: 200, success: true });
};


module.exports = {
    findNotification,
    updateNotification,
    addNotification,
    deleteNotification,
    getAllNotification,
}