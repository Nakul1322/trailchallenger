const HttpStatus = require("http-status");
const errors = require("../errors");
require("dotenv").config();
const Shipping = require("../models/shipping");
const Cart = require("../models/cart");
const Order = require("../models/order");
const PaymentRecord = require("../models/newpaymentmodel");
const Challenge = require("../models/challenge");
const { Types } = require("mongoose");
const MyHike = require("../models/myhikes");
var stripe = require("stripe")(process.env.SECRET_KEY);
const CouponCode = require("../models/couponcode");
const CouponUser = require("../models/couponcodeuser");
const RedeemUser = require("../models/redeemcodeuser");
const RedeemCode = require("../models/redeemcode");
let Country = require("country-state-city").Country;
let State = require("country-state-city").State;
const Product = require("../models/product");
const User = require("../models/user");
const { sendForAndroid, sendForIOS } = require("../helpers/sendnotification");
const sendEmail = require("../helpers/email");
const logger = require('../logger/wingston');

// let City = require('country-state-city').City;

const newPaymentSuccess = async function (req, res, next) {
  console.log("###########################REQ>BODY<############################################", req.body)
  let sum = 0,
    updateCode,
    finalPrice,
    shippingData,
    digitalData,
    finalCode,
    myHikeId,
    myHike,
    orderNumber,
    findRedeemCodeStatus,
    productIdArray,
    findCouponCode,
    totalSubChallengePrice = 0,
    savedOrder,
    productQtyArray;
  const lastDoc = await Order.findOne().sort({ createdAt: -1 }).lean().exec();
  if (lastDoc) {
    const oldOrderNumber = lastDoc.orderNumber.split("P");
    const newOrderNumber = Number(oldOrderNumber[1]) + 1;
    orderNumber = "#HKAP" + newOrderNumber;
  }
  if (!lastDoc) {
    orderNumber = "#HKAP1";
  }
  const {
    price,
    totalPrice,
    paymentType,
    userId,
    quantity,
    deliveryType,
    cartId,
    orderType,
    trailId,
    shippingId,
    deviceId,
    couponCode,
    redeemCode,
  } = req.body;
  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$REQ BODY ###############################################", req.body)
  try {
    shippingData = await Shipping.findById(shippingId).exec();
    if (orderType == 1) {
      //for physical orders
      const findCart = await Cart.findById(cartId).exec();
      // if (couponCode) {
      //   let findCouponCode = await CouponCode.findOne({ code: couponCode }).exec();
      //   finalCode = findCouponCode._id;
      // }
      // else {
      //   finalCode = null;
      // }
      const cartData = {
        orderNumber: orderNumber,
        userId: shippingData.userId,
        products: findCart.products,
        subTotal: findCart.subTotal,
        paymentMethod: paymentType,
        orderType: orderType,
        address: shippingData.address,
        trails: null,
        deliveryType
        // couponCode: finalCode
      };
      const order = new Order(cartData);
      savedOrder = await order.save();
      for (let i = 0; i < findCart.products.length; i++) {
        sum = sum + findCart.products[i].total;
      }
      const data = {
        products: findCart.products,
        totalPrice: sum,
        paymentType: paymentType,
        userId: userId,
        trails: null,
      };
      const paymentSuccess = new PaymentRecord(data);
      const savedPaymentSuccess = await paymentSuccess.save();
      const findProductId = await Order.findById(order._id);
      productIdArray = findProductId.products.map(
        (product) => product.productId
      );
      productQtyArray = findProductId.products.map(
        (product) => product.quantity
      );
      for (let i = 0; i < productIdArray.length; i++) {
        updateQuantity = await Product.updateOne(
          { _id: Types.ObjectId(productIdArray[i]), quantity: { $gte: 0 } },
          { $inc: { quantity: -productQtyArray[i] } },
          { new: true }
        ).exec();
      }
      if (couponCode) {
        const couponCodeData = {
          userId: Types.ObjectId(userId),
          code: couponCode,
          orderId: savedOrder._id
        };
        const couponCodeUser = new CouponUser(couponCodeData);
        await couponCodeUser.save();
        findCouponCode = await CouponCode.findOneAndUpdate(
          { code: couponCode },
          { $set: { couponed: true } },
          { new: true }
        ).exec();
      }
      deleteCart = await Cart.findByIdAndRemove({ _id: cartId }).exec(); //delete cart in case of physical order
      const findEmail = await User.findById(userId).exec();
      const file = "neworder.ejs";
      logger.info(`***PAYMENT MODULE***BEFORE SENDING PHYSICAL PURCHASE EMAIL: userId: ${userId}, userName: ${findEmail.name}`);
      sendEmail(file, findEmail.email, req.t("New Order!"));
      logger.info(`***PAYMENT MODULE***AFTER SENDING ENDING PHYSICAL PURCHASE EMAIL: userId: ${userId}, userName: ${findEmail.name}`);
      return res.send({
        message: req.t('Payment_Success'),
        data: { savedPaymentSuccess, orderNumber },
        status: 200,
        success: true,
      });
    }
    if (orderType == 2) {
      console.log("ORDER TYPE 2")
      const findTrail = await Challenge.findById(trailId).exec();
      console.log(findTrail);
      if (paymentType == 'Redeem Code') {
        finalPrice = 0
      }
      else {
        finalPrice = findTrail.price
      }
      console.log("FINAL PRICE", finalPrice)
      //for digital orders
      digitalData = {
        orderNumber: orderNumber,
        userId: userId,
        orderType: orderType,
        trails: [
          {
            trailId: trailId,
            trailName: findTrail.title,
            trailDistance: findTrail.distance,
            trailPrice: findTrail.price,
            colorGradient: findTrail.colorGradient.slice(),
          },
        ],
        subTotal: finalPrice,
        paymentMethod: paymentType,
        products: null,
        address: shippingData.address,
        deliveryType
      };
      const order = new Order(digitalData);
      savedOrder = await order.save();
      const findChallenge = await Challenge.findOne({
        _id: Types.ObjectId(trailId),
      });
      let challengeType = findChallenge.challengeType;
      if (challengeType == "Multi Part") {
        let subChallenge = findChallenge.subChallenge;
        const findTrail = await Challenge.findById(trailId).exec();
        for (let i = 0; i < subChallenge.length; i++) {
          let myHikeData = {
            userId: userId,
            trailId: subChallenge[i],
            currentDistance: 0,
            deviceId: null,
            challengeType: "Long Trail",
            startTime: null,
            endTime: null,
            lastCoordinate: null,
            duration: 0,
            completionPercentage: 0,
          };
          const hike = new MyHike(myHikeData);
          myHike = await hike.save();
          myHikeId = myHike._id
          const data = {
            trails: digitalData.trails,
            totalPrice: digitalData.subTotal,
            paymentType: paymentType,
            userId: userId,
            products: null,
            hikeId: Types.ObjectId(myHikeId)
          };
          const paymentSuccess = new PaymentRecord(data);
          const savedPaymentSuccess = await paymentSuccess.save();
        }
      }
      else {
        let myHikeData = {
          userId: userId,
          trailId: trailId,
          currentDistance: 0,
          deviceId: null,
          challengeType: challengeType,
          startTime: null,
          endTime: null,
          lastCoordinate: null,
          duration: 0,
          completionPercentage: 0,
        };
        const hike = new MyHike(myHikeData);
        myHike = await hike.save();
      }
      myHikeId = myHike._id;
      console.log("HIKE ID________________________________________: ", myHikeId)
      const data = {
        trails: digitalData.trails,
        totalPrice: digitalData.subTotal,
        paymentType: paymentType,
        userId: userId,
        products: null,
        hikeId: Types.ObjectId(myHikeId)
      };
      console.log("THIS IS THE REQD CASE________________________________________: ", data)
      const paymentSuccess = new PaymentRecord(data);
      const savedPaymentSuccess = await paymentSuccess.save();
      //findCouponCode = await CouponCode.findOneAndUpdate({ code: couponCode, quantity: { $gt: 0 } }, { $inc: { quantity: -1 } }, { new: true }).exec();
      if (redeemCode) {
        const findDeviceIdFromUserId = await User.findById(userId)
        const desiredGuestCase = await RedeemUser.findOne({ deviceId: findDeviceIdFromUserId.deviceId, userId: null })
        if (desiredGuestCase) {
          const updateGuestRedeemCodeToUser = await RedeemUser.findOneAndUpdate({ deviceId: findDeviceIdFromUserId.deviceId, userId: null }, { $set: { userId: Types.ObjectId(userId) } }, { new: true }).sort({ createdAt: -1 }).exec();
          const updateViceVersa = await RedeemUser.findOneAndUpdate({ userId: Types.ObjectId(userId), deviceId: findDeviceIdFromUserId.deviceId }, { $set: { deviceId: null }, status: true }, { new: true }).exec();
        }
        const updateRedeemCodeStatusUserId = await RedeemUser.findOneAndUpdate({ userId: Types.ObjectId(userId) })
        findRedeemCodeStatus = await RedeemUser.findOneAndUpdate({ userId: Types.ObjectId(userId), code: redeemCode }, { $set: { status: true } }, { new: true }).exec();
        const removeUnUsedRedeemCodes = await RedeemUser.deleteMany({ userId: Types.ObjectId(userId), status: false })
        updateCode = await RedeemCode.findOneAndUpdate(
          { code: redeemCode },
          { $set: { $inc: { code: 1 }, redeemed: true } },
          { new: true }
        ).exec();
      }
      if (couponCode) {
        const couponCodeData = {
          userId: Types.ObjectId(userId),
          code: couponCode,
          orderId: savedOrder._id
        };
        const couponCodeUser = new CouponUser(couponCodeData);
        await couponCodeUser.save();
        findCouponCode = await CouponCode.findOneAndUpdate(
          { code: couponCode },
          { $set: { couponed: true } },
          { new: true }
        ).exec();
      }

      const findEmail = await User.findById(userId).exec();
      const file = "newchallenge.ejs";
      logger.info(`***PAYMENT MODULE***BEFORE SENDING SENDING DIGITAL PURCHASE EMAIL: userId: ${userId}, userName: ${findEmail.name}`);
      sendEmail(file, findEmail.email, req.t("Challenge Accepted!"));
      logger.info(`***PAYMENT MODULE***AFTER SENDING SENDING DIGITAL PURCHASE EMAIL: userId: ${userId}, userName: ${findEmail.name}`);
      return res.send({
        message: req.t('Payment_Success'),
        data: { savedPaymentSuccess, myHikeId, trailId, orderNumber },
        status: 200,
        success: true,
      });
    }
  } catch (err) {
    return next(err);
  }
};

const paymentSheet = async function (req, res, next) {
  let stateCode,
    countryCode,
    allCountries = [],
    allStates = [];
  const { totalPrice, userId, address, description, name, phone, email } =
    req.body;
  // const user = await User.findOne({ _id: userId }).lean().exec();
  const lowestCurrencyTotalPrice = parseFloat(totalPrice) * 100;
  allCountries = Country.getAllCountries();
  for (var i = 0; i < allCountries.length; i++) {
    if (allCountries[i].name == address.country) {
      countryCode = allCountries[i].isoCode;
      break;
    }
  }
  allStates = State.getAllStates();
  for (var i = 0; i < allStates.length; i++) {
    if (
      allStates[i].name == address.state &&
      allStates[i].countryCode == countryCode
    ) {
      stateCode = allStates[i].isoCode;
      break;
    }
  }
  const customer = await stripe.customers.create({
    name: name,
    // address: {
    //   line1: '510 Townsend St',
    //   postal_code: '98140',
    //   city: 'andrifgfg ef',
    //   state: 'CA',
    //   country: 'US',
    // },
    address: {
      line1: address.line1,
      postal_code: address.postal_code,
      city: address.city,
      state: stateCode,
      country: countryCode,
    },
    email: email,
    phone: phone,
  });
  console.log(address);
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer.id },
    { apiVersion: "2020-08-27" }
  );

  // Get countryId from the request header and use 4 as a default value
  const countryId = req.header('countryId') || 1;
  // Set the currency based on countryId
  const currency = countryId == 1 ? "HKD" : "USD";

  const paymentIntent = await stripe.paymentIntents.create({
    amount: lowestCurrencyTotalPrice,
    currency: currency,
    shipping: {
      name: name,
      // address: {
      //   line1: '510 Townsend St',
      //   postal_code: '98140',
      //   city: 'andrifgfg ef',
      //   state: 'CA',
      //   country: 'US',
      // },
      address: {
        line1: address.line1,
        postal_code: address.postal_code,
        city: address.city,
        state: stateCode,
        country: countryCode,
      },
    },
    customer: customer.id,
    automatic_payment_methods: {
      enabled: true,
    },
    description: "payment",
  });
  console.log(paymentIntent, ephemeralKey);
  return res.json({
    message: req.t('Payment_Intent'),
    data: {
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.PUBLISHABLE_KEY,
    },
    status: 200,
    success: true,
  });
};

const webHook = async function (req, res, next) {
  const endpointSecret =
    "whsec_89c50e8ac319efc80eeff71ef105ee6817762d4df2ab512e9b481cca0e3c273f";
  let event = request.body;
  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = request.headers["stripe-signature"];
    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Then define and call a method to handle the successful payment intent.
      // handlePaymentIntentSucceeded(paymentIntent);
      break;
    case "payment_method.attached":
      const paymentMethod = event.data.object;
      // Then define and call a method to handle the successful attachment of a PaymentMethod.
      // handlePaymentMethodAttached(paymentMethod);
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }
  response.send();
};

const paymentRecord = async (req, res, next) => {
  let paymentList;
  let { page, pageSize } = req.query;
  page = page || 0;
  pageSize = pageSize || 10;
  let skip = Number(page * pageSize);
  try {
    console.log(page, pageSize);
    paymentList = await PaymentRecord.aggregate([
      {
        $match: { trails: { $ne: null } },
      },
      {
        $sort: { createdAt: -1 },
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
        $project: {
          _id: 1,
          userId: 1,
          products: 1,
          paymentStatus: 1,
          paymentType: 1,
          trails: 1,
          createdAt: 1,
          updatedAt: 1,
          email: "$user.email",
        },
      },
    ])
      .skip(skip)
      .limit(Number(pageSize))
      .exec();
    const allRecord = await PaymentRecord.find().exec();
    totalCount = allRecord.length
  } catch (err) {
    return next(err);
  }

  return res.status(HttpStatus.OK).json({
    message: "Payment Record",
    data: { paymentList, totalCount },
    status: 200,
    success: true,
  });
};

module.exports = {
  newPaymentSuccess,
  // paymentSuccess,
  paymentSheet,
  webHook,
  paymentRecord,
};
