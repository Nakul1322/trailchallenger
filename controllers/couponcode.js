const HttpStatus = require("http-status");

const moment = require("moment");
var crypto = require("crypto");
const errors = require("../errors");
const CouponCode = require("../models/couponcode");
const CouponUser = require("../models/couponcodeuser");
const { Types } = require("mongoose");
const Challenge = require("../models/challenge");

//FIND COUPON CODE
const findCouponCode = async (req, res, next) => {
  let couponcode, discountValue;
  const { code, userId, cartPrice, trailId } = req.body;
  try {
    if (code) {
      couponcode = await CouponCode.findOne({ code: code })
        .select("-__v")
        .exec();
      if (!couponcode) {
        return res.send({
          message: req.t("CouponCode_Not_Valid"),
          status: 401,
          success: false,
        });
      }
      const findCouponCodeUser = await CouponUser.findOne({
        code: code,
        userId: Types.ObjectId(userId),
      });
      if (findCouponCodeUser) {
        return res.send({
          message: req.t("CouponCode_Not_Valid"),
          status: 401,
          success: false,
        });
      }
      if (couponcode.expires) {
        const expiryDate = moment(couponcode.expires).format("YYYY-MM-DD");
        const formattedDate = moment(Date.now()).format("YYYY-MM-DD");
        if (expiryDate < formattedDate) {
          const updateStatus = await CouponCode.findOneAndUpdate(
            { code: code },
            { $set: { couponed: true } },
            { new: true }
          );
          return res.send({
            message: "Coupon code expired",
            status: 401,
            success: false,
          });
        }
      }
      if (cartPrice == 0) {
        const findTrail = await Challenge.findById(trailId).exec();
        console.log("Find Trail", findTrail);
        if (couponcode.type == "% Discount") {
          discountValue = (couponcode.amount * findTrail.price) / 100;
        }
        if (couponcode.type == "Cash Discount") {
          discountValue = couponcode.amount;
        }
      }
      if (cartPrice) {
        if (couponcode.type == "% Discount") {
          discountValue = (couponcode.amount * cartPrice) / 100;
        }
        if (couponcode.type == "Cash Discount") {
          discountValue = couponcode.amount;
        }
      }
    }
    return res.send({
      message: "Coupon code validated successfully",
      data: { couponcode, discountValue },
      status: 200,
      success: true,
    });
  } catch (err) {
    return next(err);
  }
};

//ADD NEW COUPON CODE
const addCouponCode = async function (req, res, next) {
  const { code, amount, type, couponed, expires } = req.item;
  try {
    const couponcodeExist = await CouponCode.findOne({
      code: { $regex: new RegExp("^" + code.toLowerCase() + "$", "i") },
    });
    if (couponcodeExist) {
      return res.send({
        message: "Coupon code already exists",
        status: 401,
        success: true,
      });
      // return next(errors.couponcodeExistError);
    }
    const codeCase = code.toUpperCase();
    const data = {
      code:codeCase,
      amount,
      type,
      couponed,
      expires,
    };
    const couponcode = new CouponCode(data);
    const savedCouponCode = await couponcode.save();
    return res.send({
      message: "Coupon code added successfully",
      data: { savedCouponCode },
      status: 200,
      success: true,
    });
  } catch (err) {
    return next(err);
  }
};

//DELETE COUPON CODE
const deleteCouponCode = async (req, res, next) => {
  let couponcode;
  const { id } = req.params;
  try {
    couponcode = await CouponCode.findByIdAndRemove(id);
  } catch (err) {
    return next(err);
  }
  return res.status(HttpStatus.OK).json({
    message: "Coupon code deleted successfully",
    data: { couponcode },
    status: 200,
    success: true,
  });
};

//LIST OF ALL COUPON CODES(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const getAllCouponCode = async (req, res, next) => {
  let categories, totalCount;
  let { page, pageSize } = req.query;
  totalCount = await CouponCode.countDocuments().exec();
  page = page || 0;
  pageSize = pageSize || totalCount;
  let skip = Number(page * pageSize);
  const { date } = req.body;
  const couponcodeFilter = {};
  try {
    if (date) {
      couponcodeFilter["createdAt"] = {
        $gte: new Date(new Date(date).setHours(0, 0, 0)),
        $lte: new Date(new Date(date).setHours(23, 59, 59)),
      };
    }
    // categories = await CouponCode.find(couponcodeFilter).sort({ createdAt: -1 }).select('-__v').skip(skip).limit(Number(pageSize)).exec();
    categories = await CouponCode.aggregate([
      {
        $match: couponcodeFilter,
      },
      {
        $sort: {createdAt: -1}
      },
      {
        $lookup: {
          from: "couponcodeusers",
          localField: "code",
          foreignField: "code",
          as: "couponcodeuser",
        },
      },
      {
        $project: {
          _id: 1,
          code: 1,
          amount: 1,
          type: 1,
          couponed: 1,
          expires: 1,
          createdAt: 1,
          updatedAt: 1,
          count: { $add: [{ $size: "$couponcodeuser" }] },
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
    message: "All coupon code",
    data: { categories, totalCount },
    status: 200,
    success: true,
  });
};

//UPDATE COUPON CODE BASED IN COUPON_ID
const updateCouponCode = async function (req, res, next) {
  let couponcode;
  const { id } = req.params;
  const updates = req.item;
  try {
    const couponcodeExist = await CouponCode.findOne({
      _id: { $ne: Number(id) },
      title: {
        $regex: new RegExp("^" + req.item.title.toLowerCase() + "$", "i"),
      },
    });
    if (couponcodeExist) {
      return res.send({
        message: req.t("CouponCode_Exists"),
        status: 401,
        success: false,
      });
    }
    couponcode = await CouponCode.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )
      .select("-__v")
      .exec();
  } catch (err) {
    return next(err);
  }
  if (!couponcode) {
    return res.send({
      message: req.t("CouponCode_Not_Valid"),
      status: 401,
      success: false,
    });
  }

  return res.status(HttpStatus.OK).json({
    message: "Update coupon code",
    data: { couponcode },
    status: 200,
    success: true,
  });
};

module.exports = {
  findCouponCode,
  addCouponCode,
  deleteCouponCode,
  getAllCouponCode,
  updateCouponCode,
};
