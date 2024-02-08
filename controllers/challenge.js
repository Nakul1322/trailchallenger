const HttpStatus = require("http-status");
const haversine = require("haversine-distance");
const errors = require("../errors");
const Challenge = require("../models/challenge");
const User = require("../models/user");
const MyHike = require("../models/myhikes");
const RedeemMedal = require("../models/redeemmedal");
const { Types } = require("mongoose");
const Token = require("../models/token");
const moment = require("moment");
const { head, isNull } = require("lodash");
const Cart = require("../models/cart");
const RedeemUser = require("../models/redeemcodeuser");
const HikeLog = require("../models/hikelog");
const PaymentRecord = require("../models/newpaymentmodel");
const LeaderBoard = require("../models/leaderboard");
const { toArray } = require("lodash");
const imageUpload = require("../helpers/imageupload");
const logger = require("../logger/wingston");
const sendEmail = require("../helpers/email");
const { checkUserValidity } = require("../middleware/checkUser");
const { constants } = require("crypto");
const { length } = require("joi/lib/types/array");
const { use } = require("i18next");
const { findOne } = require("../models/user");

const findGetChallenge = async (req, res, next) => {
  let challenge, bestTime;
  const { id, userId } = req.body;
  try {
    challenge = await Challenge.findById(req.params.id).select("-__v").exec();
    bestTime = await MyHike.find({
      $and: [
        { trailId: Types.ObjectId(req.params.id) },
        { endTime: { $ne: null } },
      ],
    })
      .sort({ duration: -1 })
      .limit(1)
      .select({ duration: 1 })
      .lean()
      .exec();
    console.log(bestTime);
    bestTime = head(bestTime);
  } catch (err) {
    return next(err);
  }
  if (!challenge) {
    return res.send(errors.challengeNotFoundError);
  }
  return res.status(HttpStatus.OK).json({
    message: "Find Challenge",
    data: { challenge, bestTime },
    status: 200,
    success: true,
  });
};

//FIND THE CHALLENGE
const findChallenge = async (req, res, next) => {
  let challenge, bestTime, myHikeId, isActiveHike, isRedeemed, findRedeemed;
  const { id, userId, deviceId } = req.body;
  try {
    challenge = await Challenge.findById(id).select("-__v").exec();
    // challenge = await Challenge.aggregate([
    //   {
    //     $match: { _id: Types.ObjectId(id) }
    //   },
    // {
    //   $lookup: {
    //     from: "pins",
    //     let: { challengeId: "$_id" },
    //     pipeline: [
    //       { $match: { $expr: { $eq: ["$challengeId", "$$challengeId"] } } }
    //     ],
    //     as: "pin",
    //   },
    // },
    // {
    //   $unwind: { path: "$pin", preserveNullAndEmptyArrays: true },
    // },
    //   {
    //     $project: {
    //       route: 1,
    //       multipartRoute: 1,
    //       _id: 1,
    //       title: 1,
    //       challengeType: 1,
    //       colorGradient: 1,
    //       howItWorks: 1,
    //       difficulty: 1,
    //       elevation: 1,
    //       distance: 1,
    //       price: 1,
    //       image: 1,
    //       withRedemption: 1,
    //       isHide: 1,
    //       adminMapImage: 1,
    //       createdAt: 1,
    //       updatedAt: 1,
    //       asSubChallenge: 1,
    //       subChallenge: 1,
    //       countryId: 1,
    //       //pin:1
    //     }
    //   }
    // ])
    isActiveHike = await MyHike.findOne({
      userId: Types.ObjectId(userId),
      trailId: Types.ObjectId(id),
      startTime: { $ne: null },
      endTime: { $eq: null },
    }).exec();
    bestTime = await MyHike.findOne({
      trailId: Types.ObjectId(id),
      endTime: { $ne: null },
    })
      .sort({ duration: 1 })
      .select({ duration: 1 })
      .lean()
      .exec();
    console.log(bestTime);
    if (userId) {
      findRedeemed = await RedeemUser.findOne({
        userId: Types.ObjectId(userId),
        status: false,
      }).exec();
      if (!findRedeemed) {
        isRedeemed = false;
      }
      if (findRedeemed) {
        isRedeemed = true;
      }
      if (!isActiveHike) {
        return res.send({
          message: "Find Challenge",
          data: { challenge, bestTime, isRedeemed },
          status: 200,
          success: true,
        });
      }
      isActiveHike = await MyHike.findOne({
        userId: Types.ObjectId(userId),
        trailId: Types.ObjectId(id),
        startTime: { $ne: null },
        endTime: { $eq: null },
      }).exec();
      if (isActiveHike) {
        myHikeId = isActiveHike._id;
        isActiveHike = isActiveHike.isActive;
      } else {
        myHikeId = null;
        isActiveHike = false;
      }
    }
    if (deviceId) {
      isRedeemed = false;
      isActiveHike = await MyHike.findOne({
        deviceId: deviceId,
        trailId: Types.ObjectId(id),
        startTime: { $ne: null },
        endTime: { $eq: null },
      }).exec();
      console.log(isActiveHike);
      if (isActiveHike) {
        myHikeId = isActiveHike._id;
        isActiveHike = isActiveHike.isActive;
      } else {
        isActiveHike = false;
        myHikeId = null;
      }
    }
  } catch (err) {
    return next(err);
  }

  if (!challenge) {
    return res.send(errors.challengeNotFoundError);
  }
  return res.status(HttpStatus.OK).json({
    message: "Find Challenge",
    data: { challenge, bestTime, isActiveHike, myHikeId, isRedeemed },
    status: 200,
    success: true,
  });
};

//UPDATE THE CHALLENGE
const updateChallenge = async function (req, res, next) {
  let challenge, validatedRoute, link;
  const { id } = req.params;
  let {
    title,
    asSubChallenge,
    subChallenge,
    howItWorks,
    difficulty,
    route,
    elevation,
    challengeType,
    colorGradient,
    withRedemption,
    distance,
    price,
    image,
    isHide,
    multipartRoute,
    countryId,
    base64,
  } = req.body;
  try {
    console.log(
      "&&&&&&&&&&&&&&&&&&&&&&REQ&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
      req.body
    );
    // if (title) {
    //   const existingChallengeName = await Challenge.findOne({ "title": { $regex: new RegExp(title, "i") } });
    //   if (existingChallengeName) {
    //     return res.send(errors.challengeTitleDuplicateError)
    //   }
    // }
    const challengeExist = await MyHike.findOne({
      trailId: Types.ObjectId(id),
      endTime: { $eq: null },
    }).exec();
    if (base64) {
      link = await imageUpload(base64, title);
    }
    // if (route) {
    //   const count = route.coordinates.length;
    //   if (count > 25) {
    //     validatedRoute = route.coordinates.slice(0, 25);
    //     route.coordinates = validatedRoute;
    //     console.log("VALIDATED ROUTE DEKHLO ________________", validatedRoute);
    //   }
    // }
    // Extracting the URL from the howItWorks string
    const urlRegex = /(www\.|http:\/\/|https:\/\/)[^\s,]+/gi;
    const howItWorksLink =
      (howItWorks && howItWorks.match(urlRegex)?.[0]) || null;
    challenge = await Challenge.findByIdAndUpdate(
      id,
      {
        $set: {
          title,
          asSubChallenge,
          subChallenge,
          howItWorks,
          difficulty,
          route,
          elevation,
          challengeType,
          colorGradient,
          withRedemption,
          distance,
          price,
          image,
          base64,
          isHide,
          asSubChallenge,
          multipartRoute,
          countryId,
          adminMapImage: link,
          howItWorksLink,
        },
      },
      { new: true }
    )
      .select("-__v")
      .exec();
  } catch (err) {
    return next(err);
  }

  if (!challenge) {
    return res.send(errors.challengeNotFoundError);
  }
  return res.status(HttpStatus.OK).json({
    message: req.t("Challenge_Updated"),
    data: challenge,
    status: 200,
    success: true,
  });
};

//ADD NEW CHALLENGE
const addChallenge = async function (req, res, next) {
  let link = null,
    validatedRoute,
    findMultipartRoute;
  let {
    title,
    asSubChallenge,
    subChallenge,
    howItWorks,
    difficulty,
    route,
    elevation,
    challengeType,
    colorGradient,
    withRedemption,
    distance,
    price,
    image,
    base64,
    isHide,
    countryId,
  } = req.body;
  try {
    console.log(req.body);
    const challengeExist = await Challenge.findOne({
      title: { $regex: new RegExp("^" + title.toLowerCase() + "$", "i") },
    });
    if (challengeExist) {
      return res.send(errors.challengeTitleDuplicateError);
    }
    if (base64) {
      link = await imageUpload(base64, title);
    }
    // if (route) {
    //   const count = route.coordinates.length;
    //   if (count > 25) {
    //     validatedRoute = route.coordinates.slice(0, 25);
    //     route.coordinates = validatedRoute;
    //   }
    // }
    if (challengeType == "Multi Part") {
      const result = subChallenge.map((s) => Types.ObjectId(s));
      console.log(result);
      findMultipartRoute = await Challenge.find({
        _id: { $in: result },
      }).select({ _id: 0, route: 1 });
      console.log("THIS IS MULTIPART ROUTE", findMultipartRoute);
    }
    // Extracting the URL from the howItWorks string
    const urlRegex = /(www\.|http:\/\/|https:\/\/)[^\s,]+/gi;
    const howItWorksLink =
      (howItWorks && howItWorks.match(urlRegex)?.[0]) || null;
    // const link = await imageUpload(base64, title)
    const challengeData = {
      title,
      challengeType,
      colorGradient,
      howItWorks,
      difficulty,
      elevation,
      distance,
      price,
      image,
      withRedemption,
      route,
      adminMapImage: link,
      isHide,
      asSubChallenge,
      subChallenge,
      multipartRoute: findMultipartRoute,
      howItWorksLink,
      countryId,
    };
    console.log(challengeData);
    const challenge = new Challenge(challengeData);
    const savedChallenge = await challenge.save();
    return res.send({
      message: req.t("Challenge_Added"),
      data: savedChallenge,
      status: 200,
      success: true,
    });
  } catch (err) {
    return next(err);
  }
};

//LIST FOR SUB CHALLENGES FOR MULTIPART CHALLENGES
const subChallengeList = async (req, res, next) => {
  let challenge;
  try {
    challenge = await Challenge.find({ asSubChallenge: true })
      .select({ title: 1, price: 1, distance: 1 })
      .exec();
    console.log(challenge);
  } catch (err) {
    return next(err);
  }
  if (!challenge) {
    return res.send(errors.challengeNotFoundError);
  }
  return res.status(HttpStatus.OK).json({
    message: "Sub Challenge List",
    data: challenge,
    status: 200,
    success: true,
  });
};

//DELETE THE CHALLENGE
const deleteChallenge = async (req, res, next) => {
  let challenge;
  const { id } = req.params;
  try {
    const challengeExist = await MyHike.findOne({
      trailId: Types.ObjectId(id),
      endTime: { $eq: null },
    }).exec();
    if (challengeExist) {
      return res.send(errors.challengeInProgressError);
    }
    challenge = await Challenge.findByIdAndRemove(id);
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: req.t("Challenge_Deleted"),
    data: challenge,
    status: 200,
    success: true,
  });
};

const getAllChallengeUserSide = async (req, res, next) => {
  // let { page, pageSize } = req.query;
  // page = page || 0;
  // pageSize = pageSize || 10;
  // let skip = Number(page * pageSize)
  let longTrail,
    dayHike,
    isRedeemed,
    findActiveChallenge,
    findHiddenChallenge,
    intersectionOfActiveAndHiddenChallenges,
    findAllHikes,
    findRedeemUser,
    outputResult;
  const { userId } = req.body;
  console.log(req.body);
  try {
    console.log(
      "HEADER _____________________________________________________________",
      req.header("countryId")
    );
    const findUserDetails = await User.findById(userId);
    findRedeemUser = await RedeemUser.findOne({
      userId: Types.ObjectId(userId),
      status: false,
    }).sort({ createdAt: -1 });
    findAllHikes = await Challenge.find({ asSubChallenge: false }).distinct(
      "_id"
    ); // ALL CHALLENGEs ID ARRAY
    const findAllHikesString = findAllHikes.map(String); // COVERT TO STRING
    findActiveChallenge = await MyHike.find({
      userId: Types.ObjectId(userId),
      isActive: true,
    }).distinct("trailId"); // FIND ALL ACTIVE HIKES
    const activeStringArray = findActiveChallenge.map(String); // CONVERT TO STRING
    const nonActiveChallenges = findAllHikesString.filter(function (val) {
      // REMOVE ACTIVE CHALLENGES FROM ALL CHALLENGES
      return activeStringArray.indexOf(val) == -1;
    });
    let nonActiveStringChallenges = nonActiveChallenges.map(String); // ALL NON ACTIVE CHALLENGES
    //HHHHHHHHHHHHHHHHHHHHHHHHHHHHH

    const findSubChallenge = await Challenge.find({
      challengeType: "Multi Part",
    }).distinct("subChallenge");
    const subChallengeStringArray = findSubChallenge.map(String);
    let intersectionOfActiveAndSubChallengesStringArray =
      subChallengeStringArray.filter((value) =>
        activeStringArray.includes(value)
      );
    const findTheBundleChallenge = await Challenge.find({
      subChallenge: {
        $elemMatch: { $in: intersectionOfActiveAndSubChallengesStringArray },
      },
    })
      .distinct("_id")
      .exec();
    const findTheBundleChallengeStringArray =
      findTheBundleChallenge.map(String);
    findHiddenChallenge = await Challenge.find({ isHide: true }).distinct(
      "_id"
    );
    const hiddenStringArray = findHiddenChallenge.map(String);
    const nonHiddenAndNonActiveChallenges = nonActiveStringChallenges.filter(
      function (val) {
        return hiddenStringArray.indexOf(val) == -1;
      }
    );
    const nonHiddenAndNonActiveChallengesString =
      nonHiddenAndNonActiveChallenges.map(String);
    const result = nonHiddenAndNonActiveChallengesString.map((s) =>
      Types.ObjectId(s)
    );
    const resultantStringArray = nonHiddenAndNonActiveChallengesString.filter(
      function (val) {
        return findTheBundleChallengeStringArray.indexOf(val) == -1;
      }
    );
    const resultantArray = resultantStringArray.map((s) => Types.ObjectId(s));
    // const countryArray = await Challenge.find({
    //   countryId: req.header("countryId"),
    // })
    //   .distinct("_id")
    //   .exec();
    // const countryArrayString = countryArray.map(String);
    // let finalResultList = resultantStringArray.filter(function (n) {
    //   return countryArrayString.indexOf(n) !== -1;
    // });
    // const newFinalResultList = finalResultList.map((s) => Types.ObjectId(s));

    //     // let newFinalResultList;
    //     // if (
    //     //   req.header("countryId") === null || req.header("countryId") === undefined
    //     // ) {
    //     //   newFinalResultList = resultantArray;
    //     // } else {
    //     //   const countryArray = await Challenge.find({
    //     //     countryId: req.header("countryId"),
    //     //   })
    //     //     .distinct("_id")
    //     //     .exec();
    //     //   const countryArrayString = countryArray.map(String);
    //     //   let finalResultList = resultantStringArray.filter(function (n) {
    //     //     return countryArrayString.indexOf(n) !== -1;
    //     //   });
    //     //   newFinalResultList = finalResultList.map((s) => Types.ObjectId(s));
    //     // }

    let newFinalResultList;
    // if (
    //   req.header("countryId") === null ||
    //   req.header("countryId") === undefined
    // )
    if (!req.header("countryId")) {
      newFinalResultList = resultantArray;
    } else {
      const countryId = req.header("countryId");
      if (countryId == 1) {
        // Show both longTrail and dayHike challenges for countryId 1
        // newFinalResultList = resultantArray;
        const countryArray = await Challenge.find({
          countryId: countryId,
        })
          .distinct("_id")
          .exec();
        const countryArrayString = countryArray.map(String);
        let finalResultList = resultantStringArray.filter(function (n) {
          return countryArrayString.indexOf(n) !== -1;
        });
        newFinalResultList = finalResultList.map((s) => Types.ObjectId(s));
      } else {
        // Show only longTrail with matching countryId, no dayHike
        const countryArray = await Challenge.find({
          countryId: countryId,
          challengeType: { $ne: "Day Hike" }, // Exclude Day Hike challenges
        })
          .distinct("_id")
          .exec();
        const countryArrayString = countryArray.map(String);
        let finalResultList = resultantStringArray.filter(function (n) {
          return countryArrayString.indexOf(n) !== -1;
        });
        newFinalResultList = finalResultList.map((s) => Types.ObjectId(s));
      }
    }

    // if (req.header("countryId") == 0 || !req.header("countryId")) {
    // if (
    //   req.header("countryId") === null ||
    //   req.header("countryId") === undefined
    // )
    if (!req.header("countryId")) {
      outputResult = resultantArray;
    } else {
      outputResult = newFinalResultList;
    }
    longTrail = await Challenge.aggregate([
      {
        $match: {
          $or: [
            { challengeType: "Multi Part" },
            {
              $and: [
                { challengeType: "Long Trail" },
                { asSubChallenge: false },
              ],
            },
          ],
          _id: { $in: outputResult },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "leaderboards",
          let: { trailId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$trailId", "$$trailId"] },
                    { $eq: ["$userId", Types.ObjectId(userId)] },
                  ],
                },
              },
            },
            {
              $project: {
                rank: 1,
              },
            },
            {
              $limit: 1,
            },
          ],
          as: "rank",
        },
      },
      {
        $unwind: { path: "$rank", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          title: 1,
          challenge: 1,
          colorGradient: 1,
          distance: 1,
          price: 1,
          image: 1,
          withRedemption: 1,
          rank: "$rank.rank",
          isHide: 1,
        },
      },
    ]); //.skip(skip).limit(Number(pageSize)).exec();
    dayHike = await Challenge.aggregate([
      {
        $match: {
          challengeType: "Day Hike",
          _id: { $in: outputResult },
        },
      },
      {
        $lookup: {
          from: "leaderboards",
          let: { trailId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$trailId", "$$trailId"] },
                    { $eq: ["$userId", Types.ObjectId(userId)] },
                  ],
                },
              },
            },
            {
              $project: {
                rank: 1,
              },
            },
            {
              $limit: 1,
            },
          ],
          as: "rank",
        },
      },
      {
        $unwind: { path: "$rank", preserveNullAndEmptyArrays: true },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          title: 1,
          challenge: 1,
          colorGradient: 1,
          distance: 1,
          price: 1,
          image: 1,
          withRedemption: 1,
          rank: "$rank.rank",
        },
      },
    ]); //.skip(skip).limit(Number(pageSize)).exec();
    if (findRedeemUser) {
      isRedeemed = true;
    }
    if (!findRedeemUser) {
      isRedeemed = false;
    }
  } catch (err) {
    return next(err);
  }
  console.log(
    "**************************************RESULT************************************************",
    longTrail,
    dayHike
  );
  return res.status(HttpStatus.OK).json({
    message: "All Challenges",
    data: { longTrail, dayHike, isRedeemed },
    status: 200,
    success: true,
  });
};

//LIST OF ALL THE CHALLENGES(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const getAllChallenge = async (req, res, next) => {
  // let { page, pageSize } = req.query;
  // page = page || 0;
  // pageSize = pageSize || 10;
  // let skip = Number(page * pageSize)
  let longTrail;
  let dayHike;
  try {
    longTrail = await Challenge.find(
      {
        $or: [{ challengeType: "Long Trail" }, { challengeType: "Multi Part" }],
      },
      {
        title: 1,
        challenge: 1,
        colorGradient: 1,
        distance: 1,
        price: 1,
        image: 1,
        withRedemption: 1,
        isHide: 1,
      }
    )
      .sort({ createdAt: -1 })
      .select("-__v")
      .exec(); //.skip(skip).limit(Number(pageSize)).exec();
    dayHike = await Challenge.find(
      { challengeType: "Day Hike" },
      {
        title: 1,
        challenge: 1,
        colorGradient: 1,
        distance: 1,
        price: 1,
        image: 1,
        withRedemption: 1,
        isHide: 1,
      }
    )
      .sort({ createdAt: -1 })
      .select("-__v")
      .exec(); //.skip(skip).limit(Number(pageSize)).exec();
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "All Challenges",
    data: { longTrail, dayHike },
    status: 200,
    success: true,
  });
};

//CHALLENGE'S LEADER BOARD
const userChallengeList = async (req, res, next) => {
  let challengeList;
  const { id } = req.params;
  let { page, pageSize } = req.query;
  page = page || 0;
  pageSize = pageSize || 10;
  let skip = Number(page * pageSize);
  try {
    // challengeList = await PaymentRecord.find({ trailId: { $in: [Types.ObjectId(id)] } }).select('-__v').exec()//.skip(skip).limit(Number(pageSize)).exec();
    challengeList = await MyHike.aggregate([
      {
        $match: {
          trailId: Types.ObjectId(id),
          userId: { $exists: true, $ne: null },
          // startTime: { $ne: null },
          lastTime: { $ne: null },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$traveledPath", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$_id",
          duration: {
            $sum: {
              $cond: [
                { $eq: ["$traveledPath", []] },
                0,
                "$traveledPath.duration",
              ],
            },
          },
          userPhoto: { $first: "$user.photo" },
          userName: { $first: "$user.name" },
          userId: { $first: "$userId" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          completionPercentage: { $first: "$completionPercentage" },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      // {
      //   $project: {
      //     userPhoto: "$user.photo",
      //     userName: "$user.name",
      //     userId: 1,
      //     duration: "$totalDuration" ,
      //     createdAt: 1,
      //     updatedAt: 1,
      //   },
      // },
    ]).exec();
    challengeDetail = await Challenge.findById({ _id: Types.ObjectId(id) })
      .skip(skip)
      .limit(Number(pageSize))
      .exec();
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "User Challenge List",
    data: { challengeList, challengeDetail },
    status: 200,
    success: true,
  });
};

const updateIsSponsored = async (req, res, next) => {
  let challenge;
  const { id } = req.params;
  try {
    challenge = await MyHike.findByIdAndUpdate(
      id,
      { $set: { isSponsored: false } },
      { new: true }
    ).exec();
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "isSponsored is updated ",
    data: { challenge },
    status: 200,
    success: true,
  });
};

const updateUserChallengeList = async (req, res, next) => {
  let challenge, user;
  const { userId, trailId } = req.body;
  // let { page, pageSize } = req.query;
  // page = page || 0;
  // pageSize = pageSize || 10;
  // let skip = Number(page * pageSize)
  try {
    challenge = await User.findByIdAndUpdate(
      { _id: Types.ObjectId(userId) },
      {
        $pull: { challenge: trailId },
      },
      {
        new: true,
      }
    ).exec(); //.skip(skip).limit(Number(pageSize)).exec();
    console.log(challenge);
    user = new User(challenge);
    await user.save();
    console.log(challenge);
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Challenge list updated successfully",
    data: { user },
    status: 200,
    success: true,
  });
};

const addHike = async function (req, res, next) {
  let myHike;
  let {
    deviceId,
    userId,
    trailId,
    startTime,
    endTime,
    lastCoordinate,
    currentDistance,
    duration,
    completionPercentage,
    rank,
  } = req.body;
  try {
    const findChallenge = await Challenge.findOne({
      _id: Types.ObjectId(trailId),
    });
    console.log(findChallenge);
    const totalTrailDistance = findChallenge.distance;
    const challengeType = findChallenge.challengeType;
    let data = {
      userId,
      trailId,
      currentDistance,
      deviceId,
      challengeType: challengeType,
      startTime,
      endTime,
      lastCoordinate,
      duration,
      completionPercentage,
    };
    const hike = new MyHike(data);
    myHike = await hike.save();
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: req.t("Challenge_Added"),
    data: myHike,
    status: 200,
    success: true,
  });
};

const addHikeFromAdmin = async function (req, res, next) {
  let myHike;
  let {
    deviceId,
    userId,
    trailId,
    startTime,
    endTime,
    lastCoordinate,
    currentDistance,
    duration,
    completionPercentage,
    rank,
  } = req.body;
  try {
    const findChallenge = await Challenge.findOne({
      _id: Types.ObjectId(trailId),
    });
    const totalTrailDistance = findChallenge.distance;
    const challengeType = findChallenge.challengeType;
    let data = {
      userId,
      trailId,
      challengeType: challengeType,
    };
    const hike = new MyHike(data);
    myHike = await hike.save();
    //Payment Record for digital purchase
    const trailData = {
      trailId: Types.ObjectId(trailId),
      trailName: findChallenge.title,
      trailPrice: findChallenge.price,
    };
    console.log(trailData);
    const paymentData = {
      trails: trailData,
      totalPrice: findChallenge.price,
      paymentType: null,
      userId: userId,
      products: null,
      hikeId: Types.ObjectId(myHike._id),
    };
    console.log(paymentData);
    const paymentRecord = new PaymentRecord(paymentData);
    const savedPaymentRecord = await paymentRecord.save();
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: req.t("Challenge_Added"),
    data: myHike,
    status: 200,
    success: true,
  });
};

const updateHike = async function (req, res, next) {
  let myHike,
    findMyHike,
    hikeDuration,
    findHike,
    sum = 0,
    category,
    newHikeId,
    newHike,
    totalDuration = 0,
    oldHike;
  const {
    traveledPath,
    pendingPath,
    startTime,
    endTime,
    route,
    lastTime,
    currentDistance,
    isActive,
    isCompleted,
    completionPercentage,
    challengeType,
    rank,
    userId,
    trailId,
    deviceId,
    userMapImage,
    duration,
  } = req.body;
  const { id } = req.params;
  try {
    console.log("KKKKKKKKKKKKKKKKKKKREQDATAllllllllllllllllllllll", req.body);
    if (traveledPath) {
      myHike = await MyHike.findByIdAndUpdate(
        id,
        { $push: { traveledPath: traveledPath } },
        { upsert: true, new: true }
      )
        .lean()
        .exec();
      findMyHike = await MyHike.findById(id).exec();
      const logData = {
        userId: findMyHike.userId,
        trailId: findMyHike.trailId,
        currentDistance,
        completionPercentage,
        duration: traveledPath.duration,
        startTime: traveledPath.startTime,
        endTime: traveledPath.endTime,
        hikeId: Types.ObjectId(id),
      };
      const addLog = new HikeLog(logData);
      await addLog.save();
    }
    if (pendingPath) {
      myHike = await MyHike.findByIdAndUpdate(
        id,
        { $push: { pendingPath: pendingPath } },
        { upsert: true, new: true }
      )
        .lean()
        .exec();
    }
    if (traveledPath) {
      console.log(findMyHike.traveledPath);
      totalDuration = findMyHike.traveledPath.reduce(
        (total, obj) => obj.duration + total,
        0
      );
    }
    myHike = await MyHike.findByIdAndUpdate(
      id,
      {
        $set: {
          trailId,
          endTime,
          startTime,
          route,
          lastTime,
          currentDistance,
          isActive,
          isCompleted,
          completionPercentage,
          challengeType,
          rank,
          userMapImage,
          duration: totalDuration,
        },
      },
      { new: true }
    )
      .lean()
      .exec();
    if (isCompleted == true) {
      findHike = await MyHike.findById(id).exec();
      const trailType = await Challenge.findOne({
        _id: Types.ObjectId(findHike.trailId),
      }).exec();
      if (trailType.challengeType == "Long Trail") {
        console.log("LONG TRAIL######################");
        // Check for existing RedeemMedal created in the last 30 seconds
        const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
        const existingRedeemMedal = await RedeemMedal.findOne({
          userId: req.body.userId,
          trailId: req.body.trailId,
          createdAt: { $gte: thirtySecondsAgo },
        }).exec();
        if (existingRedeemMedal) {
          // A similar RedeemMedal has been created in the last 30 seconds.
          // Skip the creation process.
          console.log('Skipping RedeemMedal creation due to a similar recent record.');
        } else {
          const redeemMedal = new RedeemMedal(req.body);
          await redeemMedal.save();
          const findUserName = await User.findById(redeemMedal.userId).exec();
          const file = "redeemmedal.ejs";
          const link = `${process.env.BASE_URL}/admin/mailbox?type=0`;
          logger.info(
            `***REDEEM MEDAL MODULE***BEFORE SENDING EMAIL REDEEM MEDAL EMAIL: userId: ${redeemMedal.userId}, userName: ${findUserName.name}`
          );
          sendEmail(
            file,
            process.env.ADMIN_EMAIL,
            `${req.t("Redeem_Medal_User")} ${findUserName.name}`,
            link
          );
          logger.info(
            `***REDEEM MEDAL MODULE***AFTER SENDING EMAIL REDEEM MEDAL EMAIL: userId: ${redeemMedal.userId}, userName: ${findUserName.name}`
          );
          sum = findHike.traveledPath
            .map((i) => i.duration)
            .reduce((a, b) => a + b);
          console.log(
            "%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%THE SUM OF THE HIKE IS%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%",
            sum
          );
          // let durationArray = findHike.traveledPath.map(i=>i.duration).reduce((a,b)=>a+b);
          //let durationArray = findHike.traveledPath.map((a) => a.duration);
          //sum = durationArray[durationArray.length - 1];
          myHike = await MyHike.findByIdAndUpdate(
            id,
            { $set: { duration: sum } },
            { new: true }
          ).exec();
          newHikeId = myHike._id;
          hikeDuration = sum;
          const countHike = await MyHike.find({
            userId: Types.ObjectId(userId),
            trailId: Types.ObjectId(trailId),
          }).count();
          if (countHike > 1) {
            oldHike = await MyHike.findOne({
              userId: Types.ObjectId(userId),
              trailId: Types.ObjectId(trailId),
            }).sort({ createdAt: 1 });
            newHike = await MyHike.findOne({
              userId: Types.ObjectId(userId),
              trailId: Types.ObjectId(trailId),
            }).sort({ createdAt: -1 });
            if (oldHike.duration > sum) {
              const deletePreviousHike = await MyHike.findOneAndDelete({
                userId: Types.ObjectId(userId),
                trailId: Types.ObjectId(trailId),
              }).sort({ createdAt: 1 });
              const deletePreviousLeaderBoard =
                await LeaderBoard.findOneAndDelete({
                  trailId: Types.ObjectId(trailId),
                  userId: Types.ObjectId(userId),
                }).sort({ createdAt: 1 });
              hikeDuration = sum;
              newHikeId = newHike._id;
            } else {
              const deleteNewHike = await MyHike.findOneAndDelete({
                userId: Types.ObjectId(userId),
                trailId: Types.ObjectId(trailId),
              }).sort({ createdAt: -1 });
              hikeDuration = oldHike.duration;
              newHikeId = oldHike._id;
            }
          }
        }
      }
      if (trailType.challengeType == "Day Hike") {
        console.log("HIKE KA CASEEEEEEEE");
        myHike = await MyHike.findByIdAndUpdate(
          id,
          { $set: { duration: duration } },
          { new: true }
        ).exec();
        newHikeId = myHike._id;
        hikeDuration = myHike.duration;
      }
      const leaderBoardData = {
        userId: Types.ObjectId(userId),
        trailId: Types.ObjectId(trailId),
        duration: hikeDuration,
        deviceId,
        rank: 1,
      };
      const leaderBoard = new LeaderBoard(leaderBoardData);
      await leaderBoard.save();

      const countDayHike = await MyHike.find({
        userId: Types.ObjectId(userId),
        trailId: Types.ObjectId(trailId),
      }).count();

      if (countDayHike > 1) {
        oldHike = await MyHike.findOne({
          userId: Types.ObjectId(userId),
          trailId: Types.ObjectId(trailId),
        }).sort({ createdAt: 1 });
        newHike = await MyHike.findOne({
          userId: Types.ObjectId(userId),
          trailId: Types.ObjectId(trailId),
        }).sort({ createdAt: -1 });
        if (oldHike.duration > newHike.duration) {
          const deletePreviousHike = await MyHike.findByIdAndRemove(
            oldHike._id
          ).exec();
          const deletePreviousLeaderBoard = await LeaderBoard.findOneAndDelete({
            trailId: Types.ObjectId(trailId),
            userId: Types.ObjectId(userId),
          }).sort({ createdAt: 1 });
          newHikeId = newHike._id;
        } else {
          const deleteNewHike = await MyHike.findOneAndDelete({
            userId: Types.ObjectId(userId),
            trailId: Types.ObjectId(trailId),
          }).sort({ createdAt: -1 });
          const deleteNewLeaderboard = await LeaderBoard.findOneAndDelete({
            trailId: Types.ObjectId(trailId),
            userId: Types.ObjectId(userId),
          }).sort({ createdAt: -1 });
          newHikeId = oldHike._id;
        }
      }
      let findLeaderBoard = await LeaderBoard.aggregate([
        {
          $match: {
            trailId: Types.ObjectId(trailId),
          },
        },
        {
          $setWindowFields: {
            sortBy: { duration: 1 },
            output: { rank: { $documentNumber: {} } },
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            trailId: 1,
            createdAt: 1,
            updatedAt: 1,
            rank: 1,
            duration: 1,
            deviceId: 1,
          },
        },
      ]).exec();
      const newLeaderBoard = toArray(findLeaderBoard);
      const deletePreviousLeaderBoard = await LeaderBoard.deleteMany({
        trailId: Types.ObjectId(trailId),
      });
      for (var i = 0; i < newLeaderBoard.length; i++) {
        category = new LeaderBoard(newLeaderBoard[i]);
        await category.save();
      }
      const countLeaderBoard = await LeaderBoard.find({
        userId: Types.ObjectId(userId),
        trailId: Types.ObjectId(trailId),
      }).count();
      if (countLeaderBoard > 1) {
        const findAndDeleteDuplicateLeaderBoard =
          await LeaderBoard.findOneAndDelete({
            userId: Types.ObjectId(userId),
            trailId: Types.ObjectId(trailId),
          }).sort({ createdAt: 1 });
      }
    }
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Update My Hike",
    data: { myHike, newHikeId },
    status: 200,
    success: true,
  });
};

const findHike = async (req, res, next) => {
  let hike,
    isRedeemed = false,
    isMedalRedeemed = false,
    bestTime,
    myHike,
    rank,
    newRank;
  const { id } = req.params;
  try {
    myHike = await MyHike.findById(id).select("-__v").exec();
    const userId = myHike.userId;
    const trailId = myHike.trailId;
    bestTime = await MyHike.find({
      $and: [{ trailId: Types.ObjectId(trailId) }, { endTime: { $ne: null } }],
    })
      .sort({ duration: -1 })
      .limit(1)
      .select({ duration: 1 })
      .exec();
    const isRedeemedMedal = await RedeemMedal.findOne({
      userId: Types.ObjectId(userId),
      trailId: Types.ObjectId(trailId),
    });
    if (isRedeemedMedal) {
      isRedeemed = isRedeemedMedal.isRedeemed;
    }
    rank = await LeaderBoard.findOne({
      trailId: Types.ObjectId(trailId),
      userId: Types.ObjectId(userId),
    })
      .select({ rank: 1 })
      .limit(1)
      .exec();
    if (!rank) {
      newRank = null;
    } else {
      newRank = rank.rank;
    }
    console.log("Rank", newRank);
    if (userId) {
      let findRedeemMedal = await RedeemMedal.findOne({
        userId: Types.ObjectId(userId),
        trailId: Types.ObjectId(trailId),
      }).exec();
      if (findRedeemMedal) {
        isMedalRedeemed = findRedeemMedal.isMedalRedeemed;
      }
      hike = await MyHike.aggregate([
        {
          $match: { _id: Types.ObjectId(req.params.id) },
        },
        {
          $lookup: {
            from: "challenges",
            let: { trailId: "$trailId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$trailId"] } } },
              {
                $sort: { createdAt: -1 },
              },
              {
                $project: {
                  title: "$title",
                  colorGradient: "$colorGradient",
                  image: "$image",
                  distance: "$distance",
                  route: "$route",
                  howItWorks: "$howItWorks",
                  adminMapImage: "$adminMapImage",
                  howItWorksLink: "$howItWorksLink",
                },
              },
            ],
            as: "challenge",
          },
        },
        {
          $unwind: { path: "$challenge", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $lookup: {
            from: "pins",
            let: { trailId: "$trailId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$challengeId", "$$trailId"] } } },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  pinType: 1,
                  challengeId: 1,
                  pinImage: 1,
                  headLine: 1,
                  comment: 1,
                  pinName: 1,
                  latitude: {
                    $convert: {
                      input: {
                        $arrayElemAt: [{ $split: ["$lat_long", ","] }, 0],
                      },
                      to: "double",
                    },
                  },
                  longitude: {
                    $convert: {
                      input: {
                        $arrayElemAt: [{ $split: ["$lat_long", ","] }, 1],
                      },
                      to: "double",
                    },
                  },
                  createdAt: 1,
                  updatedAt: 1,
                },
              },
            ],
            as: "pin",
          },
        },
        {
          $unwind: { path: "$pin", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: "$_id",
            userId: { $first: "$userId" },
            trailId: { $first: "$trailId" },
            deviceId: { $first: "$deviceId" },
            completionPercentage: { $first: "$completionPercentage" },
            currentDistance: { $first: "$currentDistance" },
            isActive: { $first: "$isActive" },
            startTime: { $first: "$startTime" },
            endTime: { $first: "$endTime" },
            isCompleted: { $first: "$isCompleted" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            challenge: { $first: "$challenge" },
            lastCoordinate: { $first: "$lastCoordinate" },
            Name: { $first: "$user.name" },
            challengeType: { $first: "$challengeType" },
            isRedeemed: { $first: "$isRedeemed" },
            bestTime: { $first: "$bestTime" },
            traveledPath: { $first: "$traveledPath" },
            pendingPath: { $first: "$pendingPath" },
            userMapImage: { $first: "$userMapImage" },
            isSponsored: { $first: "$isSponsored" },
            duration: { $first: "$duration" },
            pin: { $push: "$pin" },
          },
        },
        {
          $project: {
            userId: 1,
            trailId: 1,
            deviceId: 1,
            completionPercentage: 1,
            currentDistance: 1,
            isActive: 1,
            startTime: 1,
            endTime: 1,
            isCompleted: 1,
            createdAt: 1,
            updatedAt: 1,
            challenge: 1,
            lastCoordinate: 1,
            Name: "$user.name",
            challengeType: 1,
            isRedeemed: { $literal: isRedeemed },
            bestTime: bestTime,
            traveledPath: 1,
            pendingPath: 1,
            userMapImage: 1,
            isSponsored: 1,
            duration: 1,
            pin: {
              $ifNull: ["$pin", null],
            },
          },
        },
      ]).exec();
    } else {
      hike = await MyHike.aggregate([
        {
          $match: { _id: Types.ObjectId(req.params.id) },
        },
        {
          $lookup: {
            from: "challenges",
            let: { trailId: "$trailId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$trailId"] } } },
              {
                $sort: { createdAt: -1 },
              },
              {
                $project: {
                  title: "$title",
                  colorGradient: "$colorGradient",
                  image: "$image",
                  distance: "$distance",
                  route: "$route",
                  howItWorks: "$howItWorks",
                  adminMapImage: "$adminMapImage",
                  howItWorksLink: "$howItWorksLink",
                },
              },
            ],
            as: "challenge",
          },
        },
        {
          $unwind: { path: "$challenge", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "pins",
            let: { trailId: "$trailId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$challengeId", "$$trailId"] } } },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  pinType: 1,
                  challengeId: 1,
                  pinImage: 1,
                  headLine: 1,
                  comment: 1,
                  latitude: {
                    $convert: {
                      input: {
                        $arrayElemAt: [{ $split: ["$lat_long", ","] }, 0],
                      },
                      to: "double",
                    },
                  },
                  longitude: {
                    $convert: {
                      input: {
                        $arrayElemAt: [{ $split: ["$lat_long", ","] }, 1],
                      },
                      to: "double",
                    },
                  },
                  createdAt: 1,
                  updatedAt: 1,
                },
              },
            ],
            as: "pin",
          },
        },
        {
          $unwind: { path: "$pin", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: "$_id",
            userId: { $first: "$userId" },
            trailId: { $first: "$trailId" },
            deviceId: { $first: "$deviceId" },
            completionPercentage: { $first: "$completionPercentage" },
            currentDistance: { $first: "$currentDistance" },
            isActive: { $first: "$isActive" },
            startTime: { $first: "$startTime" },
            endTime: { $first: "$endTime" },
            isCompleted: { $first: "$isCompleted" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            challenge: { $first: "$challenge" },
            lastCoordinate: { $first: "$lastCoordinate" },
            Name: { $first: "$user.name" },
            challengeType: { $first: "$challengeType" },
            isRedeemed: { $first: "$isRedeemed" },
            bestTime: { $first: "$bestTime" },
            traveledPath: { $first: "$traveledPath" },
            pendingPath: { $first: "$pendingPath" },
            userMapImage: { $first: "$userMapImage" },
            isSponsored: { $first: "$isSponsored" },
            duration: { $first: "$duration" },
            pin: { $push: "$pin" },
          },
        },
        {
          $project: {
            Name: "Guest User",
            trailId: 1,
            deviceId: 1,
            completionPercentage: 1,
            currentDistance: 1,
            isActive: 1,
            startTime: 1,
            endTime: 1,
            isCompleted: 1,
            createdAt: 1,
            updatedAt: 1,
            challenge: 1,
            lastCoordinate: 1,
            challengeType: 1,
            isRedeemed: { $literal: isRedeemed },
            bestTime: bestTime,
            traveledPath: 1,
            pendingPath: 1,
            userMapImage: 1,
            isSponsored: 1,
            pin: {
              $ifNull: ["$pin", null],
            },
          },
        },
      ]).exec();
    }
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Find Hike",
    data: { hike, rank: newRank, isMedalRedeemed },
    status: 200,
    success: true,
  });
};

const deleteHike = async (req, res, next) => {
  let myHike, removePaymentRecord;
  const { id } = req.params;
  try {
    removePaymentRecord = await PaymentRecord.findOneAndRemove({
      hikeId: Types.ObjectId(id),
    });
    myHike = await MyHike.findByIdAndRemove(id);
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Hike deleted successfully",
    data: myHike,
    status: 200,
    success: true,
  });
};

const hikeList = async (req, res, next) => {
  let hike;
  const cartCount = 0;
  let { userId, deviceId } = req.body;
  let { page, pageSize } = req.query;
  page = page || 0;
  pageSize = pageSize || 10;
  let skip = Number(page * pageSize);
  if (deviceId) {
    const existingCart = await Cart.findOne({ device: deviceId }).lean().exec();
    if (existingCart) {
      cartCount === existingCart.cartCount;
    }
  }
  const filter = {};
  if (userId) {
    filter["userId"] = Types.ObjectId(userId);
  }
  if (deviceId) {
    filter["deviceId"] = deviceId;
  }
  try {
    hike = await MyHike.aggregate([
      {
        $match: filter,
      },
      {
        $lookup: {
          from: "challenges",
          let: { trailId: "$trailId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$trailId"] } } },
            {
              $sort: { createdAt: -1 },
            },
            {
              $project: {
                title: "$title",
                colorGradient: "$colorGradient",
                image: "$image",
                withRedemption: "$withRedemption",
                distance: "$distance",
              },
            },
          ],
          as: "challenge",
        },
      },
      {
        $unwind: "$challenge",
      },
      {
        $lookup: {
          from: "leaderboards",
          let: { trailId: "$trailId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$trailId", "$$trailId"] },
                    { $eq: ["$userId", Types.ObjectId(userId)] },
                  ],
                },
              },
            },
            {
              $sort: { duration: 1 },
            },
            {
              $limit: 1,
            },
            {
              $project: {
                rank: 1,
              },
            },
            {
              $limit: 1,
            },
          ],
          as: "rank",
        },
      },
      {
        $unwind: { path: "$rank", preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          rank: {
            $cond: {
              if: "$isCompleted",
              then: "$rank.rank", // Access the rank property of the rank object
              else: null,
            },
          },
        },
      },
      // {
      //   $group: {
      //     _id: "$trailId",

      //     id: { $first: "$_id" },
      //     completionPercentage: { $min: "$completionPercentage" },
      //     userId: { $first: "$userId" },
      //     trailId: { $first: "$trailId" },
      //     startTime: { $first: "$startTime" },
      //     endTime: { $first: "$endTime" },
      //     challengeType: { $first: "$challengeType" },
      //     currentDistance: { $first: "$currentDistance" },
      //     isActive: { $first: "$isActive" },
      //     isCompleted: { $first: "$isCompleted" },
      //     createdAt: { $first: "$createdAt" },
      //     updatedAt: { $first: "$updatedAt" },
      //     challenge: { $first: "$challenge" },
      //     duration: { $first: "$duration" },
      //     rank: { $first: "$rank.rank" },
      //   },
      // },
      {
        $project: {
          _id: 1,
          // _id: "$id",
          userId: 1,
          trailId: 1,
          startTime: 1,
          endTime: 1,
          completionPercentage: 1,
          challengeType: 1,
          currentDistance: 1,
          isActive: 1,
          isCompleted: 1,
          createdAt: 1,
          updatedAt: 1,
          challenge: 1,
          duration: 1,
          rank: 1,
        },
      },
      {
        $sort: { updatedAt: -1, _id: 1 }, // Sort based on updatedAt and then _id
      },
    ])
      .skip(skip)
      .limit(Number(pageSize))
      .exec();
  } catch (err) {
    return next(err);
  }
  if (deviceId) {
    return res.status(HttpStatus.OK).json({
      message: "All Hikes",
      data: { hike, cartCount },
      status: 200,
      success: true,
    });
  } else {
    return res.status(HttpStatus.OK).json({
      message: "All Hikes",
      data: { hike },
      status: 200,
      success: true,
    });
  }
};

const leaderBoard = async (req, res, next) => {
  let hike, colorGradient, newHike, userRank;
  let { trailId, userId, deviceId } = req.body;
  let { page, pageSize } = req.query;
  page = page || 0;
  pageSize = pageSize || 10;
  let skip = Number(page * pageSize);
  try {
    colorGradient = await Challenge.findById(trailId)
      .select({ colorGradient: 1 })
      .lean()
      .exec();
    hike = await LeaderBoard.aggregate([
      {
        $match: {
          trailId: Types.ObjectId(trailId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
      },
      { $sort: { duration: 1 } },
      {
        $project: {
          userId: 1,
          trailId: 1,
          userName: "$user.name",
          createdAt: 1,
          updatedAt: 1,
          rank: 1,
          duration: 1,
          deviceId: 1,
        },
      },
    ]).exec();
    if (userId) {
      userRank = await LeaderBoard.findOne({
        trailId: Types.ObjectId(trailId),
        userId: Types.ObjectId(userId),
      }).select({ rank: 1 });
    }
    if (deviceId) {
      userRank = await LeaderBoard.findOne({
        trailId: Types.ObjectId(trailId),
        deviceId: deviceId,
      }).select({ rank: 1 });
    }
    //var item = hike.find((x) => x.userId === Types.ObjectId(userId));
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Leader Board",
    data: { hike, colorGradient, userRank },
    status: 200,
    success: true,
  });
};

//LIST OF ALL THE CHALLENGES(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const viewAllOnMaps = async (req, res, next) => {
  let findTrail;
  const { type } = req.query;
  console.log(type);
  // let { page, pageSize } = req.query;
  // page = page || 0;
  // pageSize = pageSize || 10;
  // let skip = Number(page * pageSize)
  const countryId = req.header("countryId");
  let filter = { isHide: false };

  if (countryId) {
    filter["countryId"] = Number(countryId);

    if (type == 1) {
      filter["challengeType"] = "Day Hike";
    }
    if (type == 2) {
      filter["challengeType"] = "Long Trail";
    }
  } else {
    if (type == 1) {
      filter["challengeType"] = "Day Hike";
    }
    if (type == 2) {
      filter["challengeType"] = "Long Trail";
    }
  }
  console.log(filter);
  try {
    findTrail = await Challenge.aggregate([
      {
        $match: filter,
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          _id: 1,
          route: 1,
        },
      },
    ]).exec(); //.skip(skip).limit(Number(pageSize)).exec();
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "View all challenges on map",
    data: { findTrail },
    status: 200,
    success: true,
  });
};

// const logList = async (req, res, next) => {
//   let logList, getHike, challengeDetail, filter;
//   const { userId, trailId, percentage, createdAt,  } = req.body;
//   try {
//     const findHike = await HikeLog.findOne({
//       userId: Types.ObjectId(userId), trailId: Types.ObjectId(trailId),
//     }).sort({ createdAt: -1 }).select({ hikeId: 1 }).exec();
//     if (!findHike) {
//       filter = {
//         userId: Types.ObjectId(userId),
//         trailId: Types.ObjectId(trailId)
//       }
//       console.log("CASE 1", filter)
//     }
//     if (findHike) {
//       filter = {
//         userId: Types.ObjectId(userId),
//         trailId: Types.ObjectId(trailId),
//         hikeId: Types.ObjectId(findHike.hikeId)
//       }
//       console.log("CASE 2", filter)
//     }
//     logList = await HikeLog.aggregate([
//       {
//         $match: {
//           $and: [filter]
//         },
//       },
//       {
//         $lookup: {
//           from: "challenges",
//           localField: "trailId",
//           foreignField: "_id",
//           as: "challenge",
//         },
//       },
//       {
//         $sort: { createdAt: -1 },
//       },
//       {
//         $unwind: "$challenge",
//       },
//       {
//         $project: {
//           userId: 1,
//           trailId: 1,
//           trailName: "$challenge.title",
//           completionPercentage: 1,
//           currentDistance: 1,
//           duration: 1,
//           createdAt: 1,
//           updatedAt: 1,
//           startTime: 1,
//           endTime: 1
//         },
//       },
//     ]).exec(); //.skip(skip).limit(Number(pageSize)).exec();
//     getHike = await MyHike.findOne({
//       trailId: Types.ObjectId(trailId),
//       userId: Types.ObjectId(userId),
//     })
//       .select({ traveledPath: 1, pendingPath: 1 })
//       .sort({ createdAt: -1 })
//       .exec();
//     challengeDetail = await Challenge.findById(trailId).select({ route: 1, distance: 1 , title: 1});
//   } catch (err) {
//     return next(err);
//   }
//   return res.status(HttpStatus.OK).json({
//     message: "Log ",
//     data: { logList, getHike, challengeDetail },
//     status: 200,
//     success: true,
//   });
// };

const logList = async (req, res, next) => {
  let logList, getHike, challengeDetail, filter;
  const { userId, trailId, hikeId } = req.body;
  try {
    const findHike = await HikeLog.findOne({ hikeId: Types.ObjectId(hikeId) })
      .sort({ createdAt: -1 })
      .select({ hikeId: 1 })
      .exec();
    console.log("HII", findHike);
    if (!findHike) {
      logList = [];
      getHike = {};
    } else {
      logList = await HikeLog.aggregate([
        {
          $match: {
            hikeId: Types.ObjectId(findHike.hikeId),
          },
        },
        {
          $lookup: {
            from: "challenges",
            localField: "trailId",
            foreignField: "_id",
            as: "challenge",
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $unwind: "$challenge",
        },
        {
          $lookup: {
            from: "myhikes",
            localField: "hikeId",
            foreignField: "_id",
            as: "hike",
          },
        },
        {
          $unwind: { path: "$hike", preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            userId: 1,
            trailId: 1,
            trailName: "$challenge.title",
            completionPercentage: "$hike.completionPercentage",
            currentDistance: 1,
            duration: 1,
            createdAt: 1,
            updatedAt: 1,
            startTime: 1,
            endTime: 1,
          },
        },
      ]).exec(); //.skip(skip).limit(Number(pageSize)).exec();
      console.log(logList)
      getHike = await MyHike.findById(hikeId)
        .select({ traveledPath: 1, pendingPath: 1 })
        .sort({ createdAt: -1 })
        .exec();
    }
    challengeDetail = await Challenge.findById(trailId).select({
      route: 1,
      distance: 1,
      title: 1,
    });
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Log ",
    data: { logList, getHike, challengeDetail },
    status: 200,
    success: true,
  });
};

const deleteHikeAfterLogout = async (req, res, next) => {
  let myHike, updateDeviceInfo;
  const { deviceId, userId } = req.body;
  console.log(deviceId, userId);
  try {
    myHike = await MyHike.deleteMany({
      deviceId: deviceId,
      userId: { $eq: null },
    });
    updateDeviceInfo = await User.findByIdAndUpdate(
      userId,
      { $set: { deviceId: null, deviceToken: null } },
      { new: true }
    ).exec();
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Hike deleted successfully",
    data: {},
    status: 200,
    success: true,
  });
};

const updateLogData = async (req, res, next) => {
  let myHike,
    category,
    sum = 0,
    totalDuration;
  const { userId, trailId, hikeId } = req.params;
  const { traveledPath } = req.body;
  const updates = req.body;
  console.log("THIS IS THE REQ BODY ++++++++++++++++++++++++++=", req.body);
  try {
    // const findHikeLog = await MyHike.findOne( { trailId: Types.ObjectId(trailId), userId: Types.ObjectId(userId), completionPercentage: 100 }).exec();
    // if(findHikeLog){
    //   return res.send({ message: "You've completed the hike.", data: {}, status: 409, success: false })
    // }
    myHike = await MyHike.findByIdAndUpdate(
      hikeId,
      { $set: updates },
      { new: true }
    );
    if (traveledPath) {
      const sortedTraveledPath = traveledPath.sort(
        (a, b) => parseInt(a.orderIndex) - parseInt(b.orderIndex)
      );
      myHike = await MyHike.findByIdAndUpdate(
        hikeId,
        { $set: { traveledPath: sortedTraveledPath } },
        { new: true }
      );
      const totalTrailDistance = await Challenge.findById(trailId);
      sum = myHike.traveledPath.reduce(
        (total, obj) => obj.distanceCovered + total,
        0
      );
      totalDuration = myHike.traveledPath.reduce(
        (total, obj) => obj.duration + total,
        0
      );
      myHike = await MyHike.findByIdAndUpdate(
        hikeId,
        { $set: { duration: totalDuration } },
        { new: true }
      );
      // updateCompletion = myHike.traveledPath.map((a) => a.distanceCovered);
      // sum = updateCompletion[updateCompletion.length - 1];
      console.log(totalTrailDistance.distance * 1000 + "AND THE SUM IS " + sum);
      const logData = {
        userId: Types.ObjectId(userId),
        trailId: Types.ObjectId(trailId),
        currentDistance: sum,
        completionPercentage:
          (sum / (totalTrailDistance.distance * 1000)) * 100,
        duration: totalDuration,
        hikeId: Types.ObjectId(myHike._id),
      };
      console.log(logData);
      const addLog = new HikeLog(logData);
      const savedLog = await addLog.save();

      if ((sum / (totalTrailDistance.distance * 1000)) * 100 > 100) {
        updateCompletionPercentage = await HikeLog.findByIdAndUpdate(
          savedLog._id,
          { $set: { completionPercentage: 100 } }
        );
      }

      if (totalTrailDistance.distance * 1000 - sum > 25) {
        console.log("THIS IS THE DESIRED CASE");
        const currentCompletionPercentage =
          (sum / (totalTrailDistance.distance * 1000)) * 100;
        console.log(
          "THIS IS THE CURRENT COMPLETETION PERCENTAGE",
          currentCompletionPercentage
        );
        myHike = await MyHike.findByIdAndUpdate(
          hikeId,
          { $set: { completionPercentage: currentCompletionPercentage } },
          { new: true }
        );

        console.log(
          "))))))))))))))))))))))))))))))))))))))THIS IS MY HIKE DATA IN IF))))))))))))))))))))))))",
          myHike
        );
      } else {
        console.log("THIS IS THE ELSE CASE");
        myHike = await MyHike.findByIdAndUpdate(
          hikeId,
          { $set: { completionPercentage: 100 } },
          { new: true }
        );
        console.log(
          "))))))))))))))))))))))))))))))))))))))THIS IS MY ELSE DATA))))))))))))))))))))))))",
          myHike
        );
      }
      if (myHike.completionPercentage > 100) {
        console.log("THIS IS COMPLETETION MORE THAN 100 )))))))))))))))");
        myHike = await MyHike.findByIdAndUpdate(
          hikeId,
          {
            $set: {
              completionPercentage: 100,
              currentDistance: totalTrailDistance.distance * 1000,
            },
          },
          { new: true }
        );
      }
      // Add the challenge from active to completed when completion percentage is 100
      if (myHike.completionPercentage == 100) {
        console.log("THIS IS COMPLETETION EQUAL THAN 100 )))))))))))))))");
        myHike = await MyHike.findByIdAndUpdate(
          hikeId,
          { $set: { isActive: false, isCompleted: true } },
          { new: true }
        );
        const redeemMedalData = {
          userId: Types.ObjectId(userId),
          trailId: Types.ObjectId(trailId),
          isCompleted: false,
          isRedeemed: false,
          isMedalRedeemed: false,
        };
        console.log(
          "^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^THIS IS RESULT%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%"
        );
        const redeemMedal = new RedeemMedal(redeemMedalData);
        await redeemMedal.save();
        const findUserName = await User.findById(redeemMedal.userId).exec();
        const file = "redeemmedal.ejs";
        const link = `${process.env.BASE_URL}/admin/mailbox?type=0`;
        logger.info(
          `***REDEEM MEDAL MODULE***BEFORE SENDING EMAIL REDEEM MEDAL EMAIL: userId: ${redeemMedal.userId}, userName: ${findUserName.name}`
        );
        sendEmail(
          file,
          process.env.ADMIN_EMAIL,
          `${req.t("Redeem_Medal_User")} ${findUserName.name}`,
          link
        );
        logger.info(
          `***REDEEM MEDAL MODULE***AFTER SENDING EMAIL REDEEM MEDAL EMAIL: userId: ${redeemMedal.userId}, userName: ${findUserName.name}`
        );
      }
      if (myHike.isCompleted == true) {
        myHike = await MyHike.findByIdAndUpdate(
          hikeId,
          { $set: { currentDistance: totalTrailDistance.distance * 1000 } },
          { new: true }
        );
        console.log("Challenge Completed is true )))))))))))))))");
        //LeaderBoard Manipulation
        const leaderBoardData = {
          userId: Types.ObjectId(userId),
          trailId: Types.ObjectId(trailId),
          duration: totalDuration,
          rank: 1,
        };
        console.log(
          "THIS IS LEADERBOARD DATA )))))))))))))))",
          leaderBoardData
        );
        const leaderBoard = new LeaderBoard(leaderBoardData);
        await leaderBoard.save();
        console.log("***********************************", leaderBoardData);
        //Update Existing Leaderboard Data
        const findExistingLeaderBoard = await LeaderBoard.find({
          userId: Types.ObjectId(userId),
          trailId: Types.ObjectId(trailId),
        }).sort({ createdAt: -1 });
        if (findExistingLeaderBoard.length > 1) {
          if (
            findExistingLeaderBoard[0].duration >
            findExistingLeaderBoard[1].duration
          ) {
            const deleteExistingLeaderBoard =
              await LeaderBoard.findByIdAndRemove(
                findExistingLeaderBoard[0]._id
              ).exec();
          } else {
            const deleteExistingLeaderBoard =
              await LeaderBoard.findByIdAndRemove(
                findExistingLeaderBoard[1]._id
              ).exec();
          }
        }
        const updateExistingLeaderboard = await LeaderBoard.findOneAndUpdate(
          {
            userId: Types.ObjectId(userId),
            trailId: Types.ObjectId(trailId),
          },
          {
            $set: { duration: totalDuration },
          },
          { new: true }
        );

        //Sort Leaderboard Data
        let findLeaderBoard = await LeaderBoard.aggregate([
          {
            $match: {
              trailId: Types.ObjectId(trailId),
            },
          },
          {
            $setWindowFields: {
              sortBy: { duration: 1 },
              output: { rank: { $documentNumber: {} } },
            },
          },
          {
            $project: {
              _id: 1,
              userId: 1,
              trailId: 1,
              createdAt: 1,
              updatedAt: 1,
              rank: 1,
              duration: 1,
              deviceId: 1,
            },
          },
        ]).exec();
        const newLeaderBoard = toArray(findLeaderBoard);
        //Delete Pervious Data for the latest Ranking
        const deletePreviousLeaderBoard = await LeaderBoard.deleteMany({
          trailId: Types.ObjectId(trailId),
        });
        for (var i = 0; i < newLeaderBoard.length; i++) {
          category = new LeaderBoard(newLeaderBoard[i]);
          await category.save();
        }
      }
    }
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Log Updated successfully",
    data: myHike,
    status: 200,
    success: true,
  });
};

const getLogData = async (req, res, next) => {
  let myHike, challengeDetail;
  const { userId, trailId, hikeId } = req.params;
  try {
    myHike = await MyHike.findById(hikeId);
    challengeDetail = await Challenge.findById(trailId).select({
      route: 1,
      distance: 1,
    });
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Log Updated successfully",
    data: { myHike, challengeDetail },
    status: 200,
    success: true,
  });
};

const editLogData = async (req, res, next) => {
  console.log("YAY");
  let myHike, updateTotalDUration, updateHike, updateLogListData;
  const { userId, trailId, newHikeTime, oldHikeTime, hikeId } = req.body;
  try {
    updateHike = await MyHike.updateOne(
      {
        _id: Types.ObjectId(hikeId),
        isActive: true,
        traveledPath: { $elemMatch: { duration: oldHikeTime } },
      },
      {
        $set: { "traveledPath.$.duration": newHikeTime },
      },
      { new: true }
    );
    console.log("YAY");
    myHike = await MyHike.findById(hikeId).exec();
    const hikeTraveledPath = myHike.traveledPath;
    const totalDuration = hikeTraveledPath.reduce(
      (total, obj) => obj.duration + total,
      0
    );
    updateTotalDUration = await MyHike.findByIdAndUpdate(
      hikeId,
      { $set: { duration: totalDuration } },
      { new: true }
    );
    updateLogListData = await HikeLog.findOneAndUpdate(
      { hikeId: Types.ObjectId(hikeId), duration: oldHikeTime },
      { $set: { duration: newHikeTime } },
      { new: true }
    ).exec();
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Log edited successfully",
    data: { updateTotalDUration },
    status: 200,
    success: true,
  });
};

const challengeCompletionPopupScreen = async (req, res, next) => {
  let myHike, challengeDetail;
  const { userId, trailId } = req.params;
  try {
    myHike = await MyHike.aggregate([
      {
        $match: {
          trailId: Types.ObjectId(trailId),
          userId: Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "challenges",
          localField: "trailId",
          foreignField: "_id",
          as: "challenge",
        },
      },
      {
        $unwind: { path: "$challenge", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          challengeName: "$challenge.title",
          challengeDistance: "$challenge.distance",
          colorGradient: "$challenge.colorGradient",
          userMapImage: 1,
        },
      },
    ]);
    findRank = await LeaderBoard.findOne({
      trailId: Types.ObjectId(trailId),
      userId: Types.ObjectId(userId),
    }).select({ rank: 1 });
    challengeDetail = await LeaderBoard.aggregate([
      {
        $match: {
          trailId: Types.ObjectId(trailId),
        },
      },
      {
        $sort: { rank: 1 },
      },
      {
        $lookup: {
          from: "challenges",
          localField: "trailId",
          foreignField: "_id",
          as: "challenge",
        },
      },
      {
        $unwind: { path: "$challenge", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          trailId: 1,
          deviceId: 1,
          rank: 1,
          duration: 1,
          createdAt: 1,
          updatedAt: 1,
          name: "$user.name",
        },
      },
    ])
      .skip(findRank.rank - 1)
      .limit(8);
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Pop Up screen",
    data: { challengeDetail, myHike },
    status: 200,
    success: true,
  });
};

const updateLogBasedOnCoordinates = async (req, res, next) => {
  let myHike,
    updatedHikeLog,
    isActive = true,
    isCompleted = false;
  const {
    userId,
    trailId,
    startLatitude,
    startLongitude,
    endLatitude,
    endLongitude,
    distance,
    duration,
    hikeId,
  } = req.body;
  try {
    const durationInSeconds = duration * 60;
    console.log(
      "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ REQ BODY $$$$$$$$$$$$$$$$$$$$$$$$$$$$ ",
      req.body
    );
    const challenge = await Challenge.findById(trailId).exec();
    console.log(challenge.route.coordinates[0]);
    myHike = await MyHike.findById(hikeId);
    console.log(distance, challenge.distance * 1000);
    let completionPercentage = Math.round(
      (Number(distance) / (challenge.distance * 1000)) * 100
    );
    if (completionPercentage < 100) {
      isActive = true;
      isCompleted = false;
    }
    if (completionPercentage >= 100) {
      isActive = false;
      isCompleted = true;
      completionPercentage = 100;
      const leaderBoardData = {
        userId: Types.ObjectId(userId),
        trailId: Types.ObjectId(trailId),
        duration: durationInSeconds,
        rank: 1,
      };
      console.log(
        "LEADERBOARD DATA))))))))))))))))))))))))))): ",
        leaderBoardData,
        isActive,
        isCompleted
      );
      const leaderBoard = new LeaderBoard(leaderBoardData);
      await leaderBoard.save();
      const findExistingLeaderBoard = await LeaderBoard.find({
        userId: Types.ObjectId(userId),
        trailId: Types.ObjectId(trailId),
      }).sort({ createdAt: -1 });
      if (findExistingLeaderBoard.length > 1) {
        if (
          findExistingLeaderBoard[0].duration >
          findExistingLeaderBoard[1].duration
        ) {
          const deleteExistingLeaderBoard = await LeaderBoard.findByIdAndRemove(
            findExistingLeaderBoard[0]._id
          ).exec();
        } else {
          const deleteExistingLeaderBoard = await LeaderBoard.findByIdAndRemove(
            findExistingLeaderBoard[1]._id
          ).exec();
        }
      }
      //Sort Leaderboard Data
      let findLeaderBoard = await LeaderBoard.aggregate([
        {
          $match: {
            trailId: Types.ObjectId(trailId),
          },
        },
        {
          $setWindowFields: {
            sortBy: { duration: 1 },
            output: { rank: { $documentNumber: {} } },
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            trailId: 1,
            createdAt: 1,
            updatedAt: 1,
            rank: 1,
            duration: 1,
            deviceId: 1,
          },
        },
      ]).exec();
      const newLeaderBoard = toArray(findLeaderBoard);
      //Delete Pervious Data for the latest Ranking
      const deletePreviousLeaderBoard = await LeaderBoard.deleteMany({
        trailId: Types.ObjectId(trailId),
      });
      for (var i = 0; i < newLeaderBoard.length; i++) {
        category = new LeaderBoard(newLeaderBoard[i]);
        await category.save();
      }
      const redeemMedalData = {
        userId: Types.ObjectId(userId),
        trailId: Types.ObjectId(trailId),
        isCompleted: false,
        isRedeemed: false,
        isMedalRedeemed: false,
      };
      const redeemMedal = new RedeemMedal(redeemMedalData);
      await redeemMedal.save();
      const findUserName = await User.findById(redeemMedal.userId).exec();
      const file = "redeemmedal.ejs";
      const link = `${process.env.BASE_URL}/admin/mailbox?type=0`;
      logger.info(
        `***REDEEM MEDAL MODULE***BEFORE SENDING EMAIL REDEEM MEDAL EMAIL: userId: ${redeemMedal.userId}, userName: ${findUserName.name}`
      );
      sendEmail(
        file,
        process.env.ADMIN_EMAIL,
        `${req.t("Redeem_Medal_User")} ${findUserName.name}`,
        link
      );
      logger.info(
        `***REDEEM MEDAL MODULE***AFTER SENDING EMAIL REDEEM MEDAL EMAIL: userId: ${redeemMedal.userId}, userName: ${findUserName.name}`
      );
    }
    const data = {
      isActive,
      isCompleted,
      traveledPath: {
        startCoordinate: {
          latitude: startLatitude,
          longitude: startLongitude,
        },
        lastCoordinate: {
          latitude: endLatitude,
          longitude: endLongitude,
        },
        distanceCovered: distance,
        orderIndex: 0,
        startTime: null,
        endTime: null,
        duration: durationInSeconds,
      },
      pendingPath: [],
      duration: durationInSeconds,
      completionPercentage: completionPercentage,
      currentDistance: distance,
    };
    console.log(data);
    updatedHikeLog = await MyHike.findByIdAndUpdate(
      hikeId,
      { $set: data },
      { new: true }
    );
    const deleteExistingHikeLogs = await HikeLog.deleteMany({
      hikeId: Types.ObjectId(hikeId),
    });
    const hikeLogData = {
      userId: Types.ObjectId(userId),
      trailId: Types.ObjectId(trailId),
      duration: durationInSeconds,
      completionPercentage: completionPercentage,
      currentDistance: distance,
      hikeId: Types.ObjectId(hikeId),
    };
    const hikeLog = new HikeLog(hikeLogData);
    await hikeLog.save();
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Log Updated successfully",
    data: updatedHikeLog,
    status: 200,
    success: true,
  });
};

const liveChallengeList = async (req, res, next) => {
  let liveChallengeList;
  const filter = {};
  const { status } = req.query;
  if (status == 1) {
    filter["isActive"] = true;
  }
  if (status == 2) {
    filter["isCompleted"] = true;
  }
  try {
    liveChallengeList = await MyHike.aggregate([
      {
        $match: filter,
      },
      {
        $sort: { updatedAt: -1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "challenges",
          localField: "trailId",
          foreignField: "_id",
          as: "challenge",
        },
      },
      {
        $unwind: { path: "$challenge", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 1,
          photo: "$user.photo",
          name: "$user.name",
          challengeName: "$challenge.title",
          updatedAt: 1,
          userId: 1,
          completionPercentage: {
            $cond: [
              {
                $eq: ["$isCompleted", true],
              },
              100,
              {
                $cond: [
                  {
                    $eq: ["$isActive", true],
                  },
                  "$completionPercentage",
                  null,
                ],
              },
            ],
          },
        },
      },
    ]);
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Live challenge list",
    data: liveChallengeList,
    status: 200,
    success: true,
  });
};

const leaderBoardList = async (req, res, next) => {
  let hike;
  let { trailId } = req.params;
  let { page, pageSize } = req.query;
  page = page || 0;
  pageSize = pageSize || 10;
  let skip = Number(page * pageSize);
  try {
    hike = await LeaderBoard.aggregate([
      {
        $match: {
          trailId: Types.ObjectId(trailId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$_id",
          duration: { $min: "$duration" },
          userId: { $first: "$userId" },
          userName: { $first: "$user.name" },
          userImage: { $first: "$user.photo" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          deviceId: { $first: "$deviceId" },
          trailId: { $first: "$trailId" },
          rank: { $first: "$rank" },
        },
      },
      { $sort: { rank: 1 } },
    ])
      .skip(skip)
      .exec();
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Leader Board",
    data: hike,
    status: 200,
    success: true,
  });
};

const updateRanking = async (req, res, next) => {
  let findLeaderBoardRecord, updateHikeRecord, findLeaderBoard;
  let { trailId, userId, duration } = req.body;
  let { page, pageSize } = req.query;
  page = page || 0;
  pageSize = pageSize || 10;
  let skip = Number(page * pageSize);
  try {
    findLeaderBoardRecord = await LeaderBoard.findOneAndUpdate(
      { traild: Types.ObjectId(trailId), userId: Types.ObjectId(userId) },
      { $set: { duration: duration } },
      { new: true }
    ).exec();
    updateHikeRecord = await MyHike.findOneAndUpdate(
      { traild: Types.ObjectId(trailId), userId: Types.ObjectId(userId) },
      { $set: { duration: duration } },
      { new: true }
    ).exec();
    //Sort Leaderboard Data
    let findLeaderBoard = await LeaderBoard.aggregate([
      {
        $match: {
          trailId: Types.ObjectId(trailId),
        },
      },
      {
        $setWindowFields: {
          sortBy: { duration: 1 },
          output: { rank: { $documentNumber: {} } },
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          trailId: 1,
          createdAt: 1,
          updatedAt: 1,
          rank: 1,
          duration: 1,
          deviceId: 1,
        },
      },
    ])
      .skip(skip)
      .exec();
    const newLeaderBoard = toArray(findLeaderBoard);
    //Delete Pervious Data for the latest Ranking
    const deletePreviousLeaderBoard = await LeaderBoard.deleteMany({
      trailId: Types.ObjectId(trailId),
    });
    for (var i = 0; i < newLeaderBoard.length; i++) {
      const updateRecord = new LeaderBoard(newLeaderBoard[i]);
      await updateRecord.save();
    }
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Leaderboard ranking updated successfully",
    data: findLeaderBoard,
    status: 200,
    success: true,
  });
};

const deleteRanking = async (req, res, next) => {
  let deleteLeaderBoardRecord,
    deleteHikeRecord,
    findLeaderBoard,
    findLeaderBoardRecord;
  let { id } = req.params;
  let { page, pageSize } = req.query;
  page = page || 0;
  pageSize = pageSize || 10;
  let skip = Number(page * pageSize);
  try {
    findLeaderBoardRecord = await LeaderBoard.findById(id).lean().exec();
    const userId = findLeaderBoardRecord.userId;
    const trailId = findLeaderBoardRecord.trailId;
    deleteLeaderBoardRecord = await LeaderBoard.findByIdAndRemove(id).exec();
    deleteHikeRecord = await MyHike.findOneAndRemove({
      trailId: Types.ObjectId(trailId),
      userId: Types.ObjectId(userId),
      isCompleted: true,
    }).exec();
    //Sort Leaderboard Data
    let findLeaderBoard = await LeaderBoard.aggregate([
      {
        $match: {
          trailId: Types.ObjectId(trailId),
        },
      },
      {
        $setWindowFields: {
          sortBy: { duration: 1 },
          output: { rank: { $documentNumber: {} } },
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          trailId: 1,
          createdAt: 1,
          updatedAt: 1,
          rank: 1,
          duration: 1,
          deviceId: 1,
        },
      },
    ])
      .skip(skip)
      .exec();
    const newLeaderBoard = toArray(findLeaderBoard);
    //Delete Pervious Data for the latest Ranking
    const deletePreviousLeaderBoard = await LeaderBoard.deleteMany({
      trailId: Types.ObjectId(trailId),
    });
    for (var i = 0; i < newLeaderBoard.length; i++) {
      const updateRecord = new LeaderBoard(newLeaderBoard[i]);
      await updateRecord.save();
    }
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Leaderboard ranking deleted successfully",
    data: deleteLeaderBoardRecord,
    status: 200,
    success: true,
  });
};

module.exports = {
  findChallenge,
  updateChallenge,
  addChallenge,
  deleteChallenge,
  getAllChallenge,
  userChallengeList,
  updateUserChallengeList,
  addHike,
  updateHike,
  updateIsSponsored,
  hikeList,
  findHike,
  leaderBoard,
  deleteHike,
  viewAllOnMaps,
  findGetChallenge,
  getAllChallengeUserSide,
  logList,
  deleteHikeAfterLogout,
  updateLogData,
  getLogData,
  challengeCompletionPopupScreen,
  addHikeFromAdmin,
  subChallengeList,
  updateLogBasedOnCoordinates,
  liveChallengeList,
  editLogData,
  leaderBoardList,
  updateRanking,
  deleteRanking,
};
