const HttpStatus = require('http-status');

const errors = require('../errors');
const Community = require('../models/community');
const Comment = require('../models/comment');
const Like = require('../models/like');
const User = require('../models/user');
const Report = require('../models/report');
const ReportedUser = require('../models/reporteduser');
const logger = require('../logger/wingston');
const sendEmail = require('../helpers/email');
const { Types } = require('mongoose');
const { head } = require('lodash');
const { sendForAndroid, sendForIOS } = require('../helpers/sendnotification')

//FIND THE COMMUNITY POST BASED ON POST_ID
const findCommunity = async (req, res, next) => {
    let communityList;
    try {
        const { postId, userId } = req.body
        const filter = {};
        if (postId) {
            filter['_id'] = Types.ObjectId(postId);
        }
        communityList = await Community.aggregate([
            {
                $match: filter
            },
            {
                $lookup:
                {
                    from: 'likes',
                    let: { postId: Types.ObjectId(postId) },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{ $eq: ["$postId", "$$postId"] }, { $eq: ["$userId", Types.ObjectId(userId)] }]
                            }
                        }
                    },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $project: {
                            isLiked: 1,
                            userId: 1
                        },
                    },
                    {
                        $limit: 1
                    }
                    ],
                    as: 'like'
                }
            },
            {
                $lookup:
                {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $addFields: {
                    name: "$user.name",
                    userPhoto: "$user.photo",
                }
            },
            {
                $project: {
                    name: 1,
                    userId: 1,
                    content: 1,
                    userPhoto: 1,
                    content: 1,
                    totalComment: 1,
                    img: 1,
                    totalLikes: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    postType: 1,
                    like: 1,
                    trailName: 1
                }
            }
        ])
    }
    catch (err) {
        return next(err);
    }

    if (!communityList) {
        return res.send(errors.communityNotFoundError);
    }

    return res.status(HttpStatus.OK).json({ message: "Find Community", data: { communityList }, status: 200, success: true });
};

//ADD NEW POST TO COMMUNITY
const addCommunity = async function (req, res, next) {
    try {
        const community = new Community(req.item);
        const savedCommunity = await community.save();
        return res.send({ message: req.t('Post_Added'), data: savedCommunity, status: 200, success: true });
    } catch (err) {
        return next(err);
    }
};

//DELETE POST FROM COMMUNITY
const deleteCommunity = async (req, res, next) => {
    let community;
    const { id } = req.params;
    try {
        community = await Community.findByIdAndRemove(id);
        const deleteRelatedComments = await Comment.deleteMany({ postId: Types.ObjectId(id) }).exec()
    } catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Post_Deleted'), data: community, status: 200, success: true });
};

//LIST OF ALL POSTS IN COMMUNITY (PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const getAllCommunity = async (req, res, next) => {
    let communityList, findReportedPost;
    const { userId, senderId, } = req.body;
    let filter = {};
    if (senderId) {
        findReportedPost = await Report.find({ userId: Types.ObjectId(senderId) }).select({ postId: 1, _id: 0 }).lean().exec()
        const finalArray = []
        findReportedPost.map(function (obj) {
            finalArray.push(Types.ObjectId(obj.postId));
        });
        const findReportedUsers = await ReportedUser.find({ reportingUserId: Types.ObjectId(senderId) }).distinct('reportedUserId')
        console.log(findReportedUsers)
        // filter['_id'] = { $nin: finalArray }
        filter = {
            _id: { $nin: finalArray },
            userId: { $nin: findReportedUsers }
        }
    }
    if (userId) {
        filter['userId'] = Types.ObjectId(userId);
        findReportedPost = await Report.find({ userId: Types.ObjectId(userId) }).select({ postId: 1, _id: 0 }).lean().exec()
        const finalArray = []
        findReportedPost.map(function (obj) {
            finalArray.push(Types.ObjectId(obj.postId));
        });
        const findReportedUsers = await ReportedUser.find({ reportingUserId: Types.ObjectId(userId) }).distinct('reportedUserId')
        console.log(findReportedUsers)
        filter['_id'] = { $nin: finalArray }
        // filter ={
        //     _id:{ $nin: finalArray },
        // }
    }
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 10;
    let skip = Number(page * pageSize)
    try {
        communityList = await Community.aggregate([
            {
                $match: filter
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $lookup:
                {
                    from: 'comments',
                    let: { postId: "$_id" },
                    pipeline: [{ $match: { $expr: { $eq: ["$postId", "$$postId"] } } },
                    {
                        $lookup: {
                            from: 'users',
                            let: { userId: "$userId" },
                            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                            {
                                $project: {
                                    commentedUserName: '$name',
                                    commentedUserPhoto: '$photo',
                                },
                            }],
                            as: 'commentedUser'
                        }
                    },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $project: {
                            userId: 1,
                            comment: 1,
                            commentedUser: 1
                        },
                    },
                    {
                        $limit: 1
                    }
                    ],
                    as: 'comment'
                }
            },
            {
                $lookup:
                {
                    from: 'likes',
                    let: { postId: "$_id" },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{ $eq: ["$postId", "$$postId"] }, { $eq: ["$userId", Types.ObjectId(senderId)] }]
                            }
                        }
                    },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $project: {
                            isLiked: 1,
                            userId: 1
                        },
                    },
                    {
                        $limit: 1
                    }
                    ],
                    as: 'like'
                }
            },
            {
                $lookup:
                {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $addFields: {
                    name: "$user.name",
                    userPhoto: "$user.photo",
                    userId: "$user._id",
                }
            },
            {
                $project: {
                    name: 1,
                    userId: 1,
                    email: 1,
                    userPhoto: 1,
                    content: 1,
                    totalComment: 1,
                    img: 1,
                    totalLikes: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    postType: 1,
                    comment: 1,
                    like: 1,
                    myHike: 1,
                    trailName: 1
                }
            }
        ]).skip(skip).limit(Number(pageSize)).exec();
        const allRecord = await Community.find().exec();
        totalCount = allRecord.length
        // totalCount = await Community.countDocuments().exec()
        if (userId) {
            totalCount = await Community.countDocuments({ userId: Types.ObjectId(userId) }).exec()
        }
    }
    catch (err) {
        return next(err);
    }

    return res.status(HttpStatus.OK).json({ message: "All Community", data: { communityList, totalCount }, status: 200, success: true });
};

//UPDATE POST FROM COMMUNITY
const updateCommunity = async function (req, res, next) {
    let community;
    const { id } = req.params;
    const updates = req.item;
    try {
        community = await Community.findByIdAndUpdate(id, { $set: updates }, { new: true })
            .select('-__v')
            .exec();
    }
    catch (err) {
        return next(err);
    }
    if (!community) {
        return res.send(errors.communityNotFoundError);
    }

    return res.status(HttpStatus.OK).json({ message: req.t('Post_Updated'), data: community, status: 200, success: true });
};

const reportPost = async (req, res, next) => {
    let report, postAlreadyReported, savedReport;
    const { postId, userId } = req.body
    try {
        postAlreadyReported = await Report.find({ $and: [{ userId: Types.ObjectId(userId) }, { postId: Types.ObjectId(postId) }] }).lean().exec();
        postAlreadyReported = head(postAlreadyReported)
        if (postAlreadyReported) {
            return res.status(401).json({ message: req.t('Post_Already_Reported'), status: 403, success: false });
        }
        report = new Report(req.body);
        savedReport = await report.save();
        const findUserName = await User.findById(userId).exec()
        const file = 'reportpost.ejs'
        const link = `${process.env.BASE_URL}/admin/mailbox?type=2`;
        logger.info(`***REPORT POST MODULE***BEFORE SENDING EMAIL REPORT POST EMAIL: userId: ${userId}, userName: ${findUserName.name}`);
        sendEmail(file, process.env.ADMIN_EMAIL, `${findUserName.name} ${req.t('Reported_Post_User')}`, link);
        logger.info(`***REPORT POST MODULE***AFTER SENDING EMAIL REPORT POST EMAIL: userId: ${userId}, userName: ${findUserName.name}`);
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Post_Reported'), data: savedReport, status: 200, success: true });
};

const listReportedPost = async (req, res, next) => {
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 10;
    let skip = Number(page * pageSize)
    let report, totalCount;
    try {
        report = await Report.aggregate([
            {
                $sort: { createdAt: -1 }
            },
            {
                $lookup:
                {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup:
                {
                    from: 'communities',
                    localField: 'postId',
                    foreignField: '_id',
                    as: 'community'
                }
            },
            {
                $unwind: { path: '$community', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup:
                {
                    from: 'users',
                    localField: 'community.userId',
                    foreignField: '_id',
                    as: 'reportedUser'
                }
            },
            {
                $unwind: { path: '$reportedUser', preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    reportedUser: '$reportedUser.name',
                    reportingUser: '$user.name',
                    email: '$user.email',
                    userPhoto: '$user.photo',
                    createdAt: 1,
                    updatedAt: 1,
                    message: '$community.content'
                }
            }
        ]).skip(skip).limit(Number(pageSize)).exec();
        totalCount = await Report.countDocuments().exec()
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "All Reported Posts", data: { report, totalCount }, status: 200, success: true });
};
//LIKE THE POST
const likePost = async function (req, res, next) {
    let likes, sendPushNotification, savedUserLikes;
    const { counter, userId, postId } = req.body;
    try {
        if (counter == 1) {
            const isLiked = await Like.findOne({ postId: Types.ObjectId(postId), userId: Types.ObjectId(userId), isLiked: true })
            if (!isLiked) {
                likes = await Community.findByIdAndUpdate({ _id: Types.ObjectId(postId) }, { $inc: { totalLikes: counter } }).exec()
                savedUserLikes = await Like.findOneAndUpdate(
                    { $and: [{ postId: Types.ObjectId(postId) }, { userId: Types.ObjectId(userId) }] },
                    { $set: { isLiked: true, postId: Types.ObjectId(postId), userId: Types.ObjectId(userId) } },
                    { upsert: true, new: true })
            }
            else {
                savedUserLikes = isLiked
            }
            const findUser = await User.findById(userId).select({ name: 1 })
            const findCreatorId = await Community.findById(postId).select({ userId: 1 })
            const findCreator = await User.findById(findCreatorId.userId)
            const deviceType = findCreator.deviceType;
            console.log(deviceType)
            if (findCreator._id == findUser.id) {
                console.log("CREATOR AND LIKE PERSON IS SAME CASE")
                return;
            }
            else {
                const notificationMessage = findUser.name + " has liked your post"
                sendPushNotification = {
                    deviceToken: [findCreator.deviceToken],
                    message: notificationMessage,
                    type: "3",
                    data: postId,
                }
            }
            if (deviceType == 1) {
                console.log("why")
                const pushNotificationForIOS = await sendForIOS(sendPushNotification)
            }
            else {
                const pushNotificationForAndroid = await sendForAndroid(sendPushNotification)
            }
            return res.status(HttpStatus.OK).json({ message: req.t('Like_Post'), data: savedUserLikes, status: 200, success: true });
        }
        if (counter == -1) {
            likes = await Community.findOneAndUpdate({ _id: Types.ObjectId(postId), totalLikes: { $gt: 0 } }, { $inc: { totalLikes: -1 } }).exec()
            savedUserLikes = await Like.findOneAndUpdate({
                $and: [{ postId: Types.ObjectId(postId) }, { userId: Types.ObjectId(userId) }]
            }, { $set: { isLiked: false } }, { new: true })
            return res.status(HttpStatus.OK).json({ message: req.t('Like_Post'), data: savedUserLikes, status: 200, success: true });
        }
    }
    catch (err) {
        return next(err);
    }
};

const allLikePost = async function (req, res, next) {
    let likes;
    const { id } = req.params;
    try {
        likes = await Like.aggregate([
            {
                $match: {
                    postId: Types.ObjectId(id),
                    isLiked: true
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $lookup:
                {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $addFields: {
                    userPhoto: "$user.photo",
                    name: "$user.name"
                }
            },
            {
                $project: {
                    name: 1,
                    userId: 1,
                    userPhoto: 1,
                    isLiked: 1
                }
            }
        ]).exec()
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Like_Post'), data: { likes }, status: 200, success: true });
};
//ADD COMMENT TO COMMUNITY
const addComment = async function (req, res, next) {
    let findPost, subNotificationMessage, sendPushNotification, pushNotificationForIOS, pushNotificationForAndroid;
    const { postId, userId } = req.body
    try {
        findPost = await Community.findByIdAndUpdate({ _id: Types.ObjectId(postId) }, { $inc: { totalComment: 1 } }).exec()
        const community = new Comment(req.body);
        const savedCommunity = await community.save();
        const findUser = await User.findById(userId).select({ name: 1, deviceType: 1 })
        const findCreatorId = await Community.findById(postId).select({ userId: 1})
        const findCreator = await User.findById(findCreatorId.userId)
        const deviceType = findCreator.deviceType;
        if (findUser._id.toString() != findCreator._id.toString()) {
            const notificationMessage = findUser.name + " has commented on your post"
            sendPushNotification = {
                deviceToken: [findCreator.deviceToken],
                message: notificationMessage,
                type: "2",
                data: postId,
            }
        }
        const countExistingComments = await Comment.find({ postId: Types.ObjectId(postId) })
        if (countExistingComments.length > 1) {
            const previousCommentedUser = await Comment.find({ postId: Types.ObjectId(postId) }).distinct('userId')
            let filteredCommentedUserData = previousCommentedUser.map(String)
            const commentedUserListAfterRemovalCreator = filteredCommentedUserData.filter(val => val !== findCreator._id.toString())
            const commentedUserListAfterRemoval = commentedUserListAfterRemovalCreator.filter(val => val !== userId)
            let resultantArray = commentedUserListAfterRemoval.map(s => Types.ObjectId(s));
            const findIOSDeviceType = await User.find({ _id: { $in: resultantArray }, deviceType: 1 }).distinct('deviceToken').exec();
            const findAndroidDeviceType = await User.find({ _id: { $in: resultantArray }, deviceType: 0 }).distinct('deviceToken').exec();
            if (userId == findCreator._id.toString()) {
                subNotificationMessage = `${findCreator.name} has commented on his post`
            }
            else {
                subNotificationMessage = `Someone has commented on ${findCreator.name}'s post`
            }
            if (findIOSDeviceType.length != 0) {
                const sendSubPushNotificationIOS = {
                    deviceToken: findIOSDeviceType,
                    message: subNotificationMessage,
                    type: "2",
                    data: postId,
                }
                pushNotificationForIOS = await sendForIOS(sendSubPushNotificationIOS)
            }
            if (findAndroidDeviceType.length !== 0) {
                const sendSubPushNotificationAndroid = {
                    deviceToken: findAndroidDeviceType,
                    message: subNotificationMessage,
                    type: "2",
                    data: postId,
                }
                pushNotificationForAndroid = await sendForAndroid(sendSubPushNotificationAndroid)
            }
        }
        if (userId != findCreator._id.toString()) {
            if (deviceType == 1) {
                pushNotificationForIOS = await sendForIOS(sendPushNotification)
            }
            else {
                pushNotificationForAndroid = await sendForAndroid(sendPushNotification)
            }
        }
        return res.send({ message: req.t('Comment_Added'), data: savedCommunity, status: 200, success: true });
    } catch (err) {
        return next(err);
    }
};

//
const commentList = async function (req, res, next) {
    let commentsList;
    const { postId } = req.query;
    const filter = {};
    if (postId) {
        filter['postId'] = Types.ObjectId(postId);
    }
    console.log(filter);
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 10;
    let skip = Number(page * pageSize)
    try {
        commentsList = await Comment.aggregate([
            {
                $match: filter
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $lookup:
                {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $addFields: {
                    name: "$user.name",
                    userPhoto: "$user.photo",
                }
            },
            {
                $project: {
                    name: 1,
                    postId: 1,
                    userId: 1,
                    userPhoto: 1,
                    comment: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    totalComment: 1
                }
            }
        ]).skip(skip).limit(Number(pageSize)).exec();
        totalCount = await Comment.find({ postId: Types.ObjectId(postId) }).count().exec()
        console.log(commentsList, totalCount)
    }
    catch (err) {
        return next(err);
    }

    return res.status(HttpStatus.OK).json({ message: "All Comments", data: { commentsList, totalCount }, status: 200, success: true });
};

//DELETE COMMENT FROM COMMUNITY
const deleteComment = async (req, res, next) => {
    let comment;
    let findPost;
    const { id } = req.params;
    try {
        comment = await Comment.findById(id);
        if (!comment) {
            return res.send(errors.commentNotFoundError);
        }
        const postId = comment.postId
        findPost = await Community.findByIdAndUpdate(postId, { $inc: { totalComment: -1 } }).exec()
        const removeComment = await Comment.findByIdAndRemove(id)
    } catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Comment_Deleted'), data: {}, status: 200, success: true });
};

//UPDATE COMMENT FROM COMMUNITY
const updateComment = async function (req, res, next) {
    let comment;
    const { id } = req.params;
    const updates = req.body;
    try {
        comment = await Comment.findByIdAndUpdate(id, { $set: updates }, { new: true })
            .select('-__v')
            .exec();
    }
    catch (err) {
        return next(err);
    }
    // if (!comment) {
    //     return res.send(errors.communityNotFoundError);
    // }

    return res.status(HttpStatus.OK).json({ message: req.t('Comment_Updated'), data: comment, status: 200, success: true });
};

//FIND THE COMMENT
const findComment = async (req, res, next) => {
    let comment;
    const { id } = req.params
    const filter = {};
    if (id) {
        filter['_id'] = Types.ObjectId(id);
    }
    try {
        comment = await Comment.aggregate([
            {
                $match: filter
            },
            {
                $lookup:
                {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $addFields: {
                    name: "$user.name",
                    userPhoto: "$user.photo",
                }
            },
            {
                $project: {
                    name: 1,
                    userId: 1,
                    comment: 1,
                    userPhoto: 1,
                    postId: 1,
                    createdAt: 1,
                    updatedAt: 1,
                }
            }
        ])
    }
    catch (err) {
        return next(err);
    }

    if (!comment) {
        return res.send(errors.commentNotFoundError);
    }

    return res.status(HttpStatus.OK).json({ message: "View comment", data: { comment }, status: 200, success: true });
};

//DELETE THE REPORTS
const deleteReport = async (req, res, next) => {
    let report;
    const { id } = req.params;
    try {
        report = await Report.findByIdAndRemove(id);
    } catch (err) {
        return next(err);
    }

    return res.status(HttpStatus.OK).json({ message: req.t('Report_Deleted'), data: report, status: 200, success: true });
};

// Report User in community list
const reportedUser = async (req, res, next) => {
    let report;
    const { reportedUserId, reportingUserId } = req.body
    try {
        report = new ReportedUser(req.body);
        await report.save();
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Reported_User'), data: report, status: 200, success: true });
};

module.exports = {
    findCommunity,
    addCommunity,
    deleteCommunity,
    getAllCommunity,
    updateCommunity,
    likePost,
    addComment,
    commentList,
    deleteComment,
    updateComment,
    allLikePost,
    findComment,
    reportPost,
    listReportedPost,
    deleteReport,
    reportedUser,
}