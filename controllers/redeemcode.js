const HttpStatus = require("http-status");

var crypto = require("crypto");
const errors = require("../errors");
const RedeemCode = require("../models/redeemcode");
const Challenge = require("../models/challenge");
const GuestUser = require("../models/guestUser");
const RedeemUser = require("../models/redeemcodeuser");
const { Types } = require("mongoose");
const MyHike = require("../models/myhikes");
const voucher_codes = require("voucher-code-generator");

//FIND THE REDEEM CODE
const findRedeemCode = async (req, res, next) => {
  let redeemcode;
  let challengeList;
  const { code, deviceId, userId } = req.body;
  const countryId = parseInt(req.header("countryId")) || null;
  try {
    const alreadyRedeemed = await RedeemCode.findOne({
      code: code,
      redeemed: true,
    });
    if (alreadyRedeemed) {
      return res.send({
        message: "Please enter a valid redemption \n code.",
        data: {},
        status: 401,
        success: false,
      });
    }
    const redeemCodeUser = await RedeemUser.findOne({
      userId: Types.ObjectId(userId),
      status: false,
    });
    if (redeemCodeUser) {
      const deleteRedeemCodeUser = await RedeemUser.findOneAndRemove({
        userId: Types.ObjectId(userId),
        // status: false
      }).exec();
    }
    redeemcode = await RedeemCode.findOne({ code: code }).select("-__v").exec();
    if (!redeemcode) {
      return res.send({
        message: "Please enter a valid redemption \n code.",
        data: {},
        status: 401,
        success: false,
      });
    }
    if (userId) {
      if (code) {
        const redeemCodeData = {
          userId: Types.ObjectId(userId),
          code,
          status: false,
        };
        const redeemCodeUser = new RedeemUser(redeemCodeData);
        await redeemCodeUser.save();
      }
    }
    if (deviceId) {
      if (code) {
        const redeemCodeData = {
          deviceId,
          code,
          status: false,
        };
        const redeemCodeUser = new RedeemUser(redeemCodeData);
        await redeemCodeUser.save();
      }
    }
    const activeChallengeList = await MyHike.find({
      userId: Types.ObjectId(userId),
      challengeType: "Long Trail",
    }).distinct("trailId");
    challengeList = await Challenge.find({
      _id: { $nin: activeChallengeList },
      withRedemption: true,
      challengeType: "Long Trail",
      isHide: false,
      asSubChallenge: false,
      countryId: countryId,
    })
      .select({
        title: 1,
        challenge: 1,
        colorGradient: 1,
        distance: 1,
        price: 1,
        image: 1,
      })
      .sort({ createdAt: -1 })
      .select("-__v")
      .exec();
    return res.send({
      message: "Redeem code validated successfully",
      data: { challengeList },
      status: 200,
      success: true,
    });
  } catch (err) {
    return next(err);
  }
};

//ADD A REDEEM CODE
const addRedeemCode = async function (req, res, next) {
  const { quantity, trailType, redeemed } = req.item;
  try {
    // let code = crypto.randomBytes(5).toString('hex');
    const codeList = voucher_codes.generate({
      length: 5,
      count: parseInt(quantity),
    });
    console.log(codeList);
    for (let i = 0; i < codeList.length; i++) {
      const data = {
        code: codeList[i],
        trailType: trailType,
        redeemed: redeemed,
      };
      const redeemcode = new RedeemCode(data);
      const savedRedeemCode = await redeemcode.save();
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.send({
      message: "Redeem code added successfully",
      data: {},
      status: 200,
      success: true,
    });
  } catch (err) {
    return next(err);
  }
};

//DELETE A REDEEM CODE
const deleteRedeemCode = async (req, res, next) => {
  let redeemcode;
  const { id } = req.params;
  try {
    redeemcode = await RedeemCode.findByIdAndRemove(id);
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Redeem code deleted successfully",
    data: redeemcode,
    status: 200,
    success: true,
  });
};

//LIST OF ALL REDEEM CODES(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const getAllRedeemCode = async (req, res, next) => {
  let categories, totalCount;
  let { page, pageSize } = req.query;
  totalCount = await RedeemCode.countDocuments().exec();
  page = page || 0;
  pageSize = pageSize || totalCount;
  let skip = Number(page * pageSize);
  const { date } = req.body;
  const redeemcodeFilter = {};
  try {
    if (date) {
      redeemcodeFilter["createdAt"] = {
        $gte: new Date(new Date(date).setHours(0, 0, 0)),
        $lte: new Date(new Date(date).setHours(23, 59, 59)),
      };
    }
    // categories = await RedeemCode.find(redeemcodeFilter).sort({ createdAt: -1 }).skip(skip).limit(Number(pageSize)).exec();
    categories = await RedeemCode.aggregate([
      {
        $match: redeemcodeFilter,
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "redeemcodeusers",
          let: { code: "$code" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$code", "$$code"] },
                    { $eq: ["$status", true] },
                  ],
                },
              },
            },
          ],
          as: "redeemcodeuser",
        },
      },
      {
        $unwind: {
          path: "$redeemcodeuser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "redeemcodeuser.userId",
          foreignField: "_id",
          as: "redeemcodeuserdetails",
        },
      },
      {
        $unwind: {
          path: "$redeemcodeuserdetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          code: 1,
          trailType: 1,
          redeemed: 1,
          count: 1,
          createdAt: 1,
          updatedAt: 1,
          __v: 1,
          userId: "$redeemcodeuser.userId",
          userName: "$redeemcodeuserdetails.name",
        },
      },
    ])
      .skip(skip)
      .limit(Number(pageSize))
      .exec();
  } catch (err) {
    return next(err);
  }

  return res.status(HttpStatus.OK).json({
    message: "All redeem code",
    data: { categories, totalCount },
    status: 200,
    success: true,
  });
};

//UPDATE A REDEEM CODE
const updateRedeemCode = async function (req, res, next) {
  let redeemcode;
  const { id } = req.params;
  const updates = req.item;
  try {
    const redeemcodeExist = await RedeemCode.findOne({
      _id: { $ne: Number(id) },
      title: {
        $regex: new RegExp("^" + req.item.title.toLowerCase() + "$", "i"),
      },
    });
    if (redeemcodeExist) {
      return next(errors.redeemcodeTitleDuplicateError);
    }
    redeemcode = await RedeemCode.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )
      .select("-__v")
      .exec();
  } catch (err) {
    return next(err);
  }
  if (!redeemcode) {
    return res.send(errors.redeemcodeNotFoundError);
  }

  return res.status(HttpStatus.OK).json({
    message: "Update redeem code",
    data: redeemcode,
    status: 200,
    success: true,
  });
};

// CHALLENGE LIST BASED ON REDEEM CODE
const redeemChallengeList = async (req, res, next) => {
  let challengeList;
  const countryId = req.header("countryId");
  console.log(countryId);
  try {
    challengeList = await Challenge.find({
      countryId: countryId,
      withRedemption: true,
      isHide: false,
    }).select({ title: 1, distance: 1, image: 1, colorGradient: 1 });
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Challenge list based on Redeem code fetched successfully",
    data: { challengeList },
    status: 200,
    success: true,
  });
};

module.exports = {
  findRedeemCode,
  addRedeemCode,
  deleteRedeemCode,
  getAllRedeemCode,
  updateRedeemCode,
  redeemChallengeList,
};
