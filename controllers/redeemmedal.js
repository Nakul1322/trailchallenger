const HttpStatus = require('http-status');
const errors = require('../errors');
const RedeemMedal = require('../models/redeemmedal');
const User = require('../models/user');
// const logger = require('../logger/wingston');
// const sendEmail = require('../helpers/email');
const { Types } = require('mongoose');

//ADD A REDEEM MEDAL
const addRedeemMedal = async function (req, res, next) {
    try {
        const { userId, trailId } = req.body;
        const findExistingRedeemMedal = await RedeemMedal.findOneAndUpdate({ userId: Types.ObjectId(userId), trailId: Types.ObjectId(trailId) }, { $set: { isMedalRedeemed: true } }, { new: true });
        if (findExistingRedeemMedal) {
            return res.send({ message: "Your medal is on the way.", data: findExistingRedeemMedal, status: 200, success: true });
        }
        const redeemMedalData = {
            userId: userId,
            trailId: trailId,
            isCompleted: false,
            isRedeemed: false,
            isMedalRedeemed: true
        }
        const redeemMedal = new RedeemMedal(redeemMedalData);
        await redeemMedal.save();
        return res.send({ message: "Your medal is on the way.", data: redeemMedal, status: 200, success: true });
    } catch (err) {
        return next(err);
    }
};

//LIST OF ALL NOTIFICATION MESSAGES(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const redeemMedalList = async (req, res, next) => {
    let redeemMedalList;
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 10;
    let skip = Number(page * pageSize)
    try {
        redeemMedalList = await RedeemMedal.aggregate([
            {
                $sort: { createdAt: -1 }
            },
            {
                $lookup: {
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
                $lookup: {
                    from: 'challenges',
                    localField: 'trailId',
                    foreignField: '_id',
                    as: 'challenge'
                }
            },
            {
                $unwind: '$challenge'
            },
            {
                $project: {
                    _id: 1,
                    trailId: 1,
                    userId: 1,
                    isCompleted: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    userName: "$user.name",
                    userEmail: "$user.email",
                    challengeName: '$challenge.title',
                    isRedeemed: 1
                }
            }
        ]).skip(skip).limit(Number(pageSize)).exec();
        const allRecord = await RedeemMedal.find().exec();
        totalCount = allRecord.length
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "RedeemMedal List", data: { redeemMedalList, totalCount }, status: 200, success: true });
};

const updateRedeemMedal = async function (req, res, next) {
    let redeemMedal;
    const { id } = req.params;
    const updates = req.body;
    try {
        redeemMedal = await RedeemMedal.findByIdAndUpdate(id, { $set: updates }, { new: true }).select('-__v').exec();
        // const findUserName = await User.findById(redeemMedal.userId).exec()
        // const file = 'redeemmedal.ejs'
        // const link = `${process.env.BASE_URL}/admin/mailbox?type=0`;
        // logger.info(`***REDEEM MEDAL MODULE***BEFORE SENDING EMAIL REDEEM MEDAL EMAIL: userId: ${redeemMedal.userId}, userName: ${findUserName.name}`);
        // sendEmail(file, process.env.ADMIN_EMAIL, `${req.t('Redeem_Medal_User')} ${findUserName.name}`, link);
        // logger.info(`***REDEEM MEDAL MODULE***AFTER SENDING EMAIL REDEEM MEDAL EMAIL: userId: ${redeemMedal.userId}, userName: ${findUserName.name}`);
    }
    catch (err) {
        return next(err);
    }

    if (!redeemMedal) {
        return res.send(errors.redeemMedalNotFoundError);
    }
    return res.status(HttpStatus.OK).json({ message: "Medal updated successfully", data: redeemMedal, status: 200, success: true });
};

const findRedeemMedal = async function (req, res, next) {
    let redeemMedalList;
    const { id } = req.params;
    // let { page, pageSize } = req.query;
    // page = page || 0;
    // pageSize = pageSize || 10;
    // let skip = Number(page * pageSize)
    try {
        redeemMedalList = await RedeemMedal.aggregate([
            {
                $match: { _id: Types.ObjectId(id) }
            },
            {
                $lookup:
                {
                    from: 'users',
                    let: { userId: "$userId" },
                    pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $project: {
                            userName: '$name',
                            userEmail: '$email',
                        },
                    }
                    ],
                    as: 'user'
                }
            },
            {
                $lookup:
                {
                    from: 'challenges',
                    let: { trailId: "$trailId" },
                    pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$trailId"] } } },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $project: {
                            challengeName: '$title',
                        },
                    }
                    ],
                    as: 'challenge'
                }
            },
            {
                $project: {
                    _id: 1,
                    trailId: 1,
                    userId: 1,
                    isCompleted: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    user: 1,
                    challenge: 1,
                    isRedeemed: 1
                }
            }
        ])//.skip(skip).limit(Number(pageSize)).exec();
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "RedeemMedal List", data: { redeemMedalList }, status: 200, success: true });
};

module.exports = {
    addRedeemMedal,
    redeemMedalList,
    updateRedeemMedal,
    findRedeemMedal
}