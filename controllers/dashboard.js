const User = require('../models/user');
const Challenge = require('../models/challenge');
const Payment = require("../models/newpaymentmodel")
const HttpStatus = require('http-status');
const { head } = require('lodash');
const MyHike = require('../models/myhikes')
const Order = require("../models/order");

//DASHBOARD APIS
const dashboard = async (req, res, next) => {
    let countUser, countCompletedChallenge, countLiveChallenge, bestSeller, totalHiked, totalHours, physicalRevenue, digitalRevenue;
    try {
        countUser = await User.countDocuments({ status: { $nin: ["Deleted"] } }).exec()-1;
        // const activeChallenges = await MyHike.find().distinct("trailId")
        // const activeChallengesString = activeChallenges.map(String)
        // const allChallengeId = await Challenge.find().distinct("_id")
        // const allChallengeIdString = allChallengeId.map(String)
        countLiveChallenge = await MyHike.find({isActive:1}).count();
        bestSeller = await Payment.aggregate([
            { $match: { trails: { $ne: null } } },
            { $sort: { createdAt: -1 } },
            { $unwind: '$trails' },
            { $group: { _id: "$trails.trailName", challengeCount: { $sum: 1 } } },
            { $sort: { challengeCount: -1 } },
            { $limit: 1 },
            {
                $project: {
                    trailName: '$_id',
                    _id: 0,
                    // challengeCount: 1
                }
            }
        ]).exec();
        bestSeller = head(bestSeller);
        totalKmsHiked = await MyHike.aggregate([
            {
                $group: {
                    _id: null,
                    totalKmsHiked: { $sum: '$currentDistance' }
                }
            },
            {
                $project: {
                    totalKmsHiked: 1,
                    _id: 0
                }
            }
        ]).exec();
        totalHiked = head(totalKmsHiked);
        totalHours = await MyHike.aggregate([
            {
                $group: {
                    _id: null,
                    totalHoursHiked: { $sum: '$duration' }
                }
            },
            {
                $project: {
                    totalHoursHiked: 1,
                    _id: 0
                }
            }
        ]).exec();
        totalHours = head(totalHours);
        physicalRevenue = await Order.aggregate([
            {
                $match: { products: { $ne: null } }
            },
            {
                $group: {
                    _id: null,
                    totalPhysicalRevenue: { $sum: '$subTotal' }
                }
            },
            {
                $project: {
                    totalPhysicalRevenue: 1,
                    _id: 0
                }
            }
        ]).exec();
        physicalRevenue = head(physicalRevenue);
        digitalRevenue = await Order.aggregate([
            {
                $match: { trails: { $ne: null } }
            },
            {
                $unwind: '$trails'
            },
            {
                $group: {
                    _id: null,
                    totalDigitalRevenue: { $sum: '$trails.trailPrice' }
                }
            },
            {
                $project: {
                    totalDigitalRevenue: 1,
                    _id: 0
                }
            }
        ]).exec();
        digitalRevenue = head(digitalRevenue);
        countCompletedChallenge = await MyHike.find({isCompleted: true}).count().exec();
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "Dashboard", data: { countUser, countLiveChallenge, bestSeller, totalHiked, totalHours, physicalRevenue, digitalRevenue, countCompletedChallenge }, status: 200, success: true });
};

module.exports = {
    dashboard
}