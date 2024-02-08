const HttpStatus = require('http-status');
const errors = require('../errors');
const Order = require('../models/order');
const { Types } = require('mongoose');

const findOrder = async (req, res, next) => {
    let order;
    let { id } = req.params
    console.log(id)
    try {
        order = await Order.aggregate([
            {
                $match: {
                    _id: Types.ObjectId(id)
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
                $lookup:
                {
                    from: 'couponcodeusers',
                    localField: '_id',
                    foreignField: 'orderId',
                    as: 'discountCode'
                }
            },
            {
                $lookup: {
                    from: 'couponcodes',
                    let: { discountCode: { $arrayElemAt: ['$discountCode', 0] } },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $cond: {
                                        if: { $eq: ['$discountCode', []] },
                                        then: { $eq: [1, 0] },  // return a false condition to exclude the document
                                        else: { $eq: ['$code', '$$discountCode.code'] }
                                    }
                                }
                            }
                        },
                        {
                            $sort: { createdAt: -1 }
                        },
                        {
                            $project: {
                                couponCode: '$code',
                                couponPrice: '$amount',
                                couponType: '$type'
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: 'coupon'
                }
            },
            {
                $project: {
                    name: "$user.name",
                    userId: 1,
                    title: 1,
                    email: "$user.email",
                    userPhoto: "$user.photo",
                    products: 1,
                    paymentMethod: 1,
                    amount: 1,
                    address: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    orderStatus: 1,
                    orderType: 1,
                    orderNumber: 1,
                    subTotal: {
                        $cond: {
                            if: {
                                $or: [
                                    { $regexMatch: { input: "$paymentMethod", regex: "Redeem code/Card Payment", options: "i" } },
                                    { $regexMatch: { input: "$paymentMethod", regex: "Redeem code", options: "i" } }
                                ]
                            },
                            then: 0,
                            else: "$subTotal"
                        }
                    },
                    deliveryType: 1,
                    trails: 1,
                    discountCode: {
                        $cond: {
                            if: { $eq: ['$discountCode', []] },
                            then: null,
                            else: '$discountCode'
                        }
                    },
                    coupon: {
                        $cond: {
                            if: { $eq: ['$discountCode', []] },
                            then: null,
                            else: '$coupon'
                        }
                    }
                },
            },
            { $unwind: { path: '$discountCode', preserveNullAndEmptyArrays: true } },
            { $unwind: { path: '$coupon', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: "$_id",
                    name: "$name",
                    userId: "$userId",
                    email: "$email",
                    userPhoto: "$userPhoto",
                    products: "$products",
                    paymentMethod: "$paymentMethod",
                    amount: "$amount",
                    address: "$address",
                    createdAt: "$createdAt",
                    updatedAt: "$updatedAt",
                    orderStatus: "$orderStatus",
                    orderType: "$orderType",
                    orderNumber: "$orderNumber",
                    subTotal: "$subTotal",
                    deliveryType: "$deliveryType",
                    trails: "$trails",
                    couponCode: {
                        $cond: {
                            if: {
                                $or: [
                                    { $regexMatch: { input: "$paymentMethod", regex: "Redeem code/Card Payment", options: "i" } },
                                    { $regexMatch: { input: "$paymentMethod", regex: "Redeem code", options: "i" } }
                                ]
                            },
                            then: { "couponPrice": 0 },
                            else: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ["$coupon.couponType", "Cash Discount"] }, then: '$coupon' },
                                        { case: { $eq: ["$coupon.couponType", "% Discount"] }, then: { "couponType": "$coupon.couponType", "couponCode": "$coupon.couponCode", "couponPrice": { '$round': [{ "$multiply": [0.01, { "$multiply": ["$subTotal", "$coupon.couponPrice"] }] }, 2] } } }
                                    ],
                                    default: { 'couponPrice': 0 }
                                }
                            }
                        }
                    },
                    discountCode: {
                        $cond: {
                            if: { $eq: ["$discountCode", null] },
                            then: null,
                            else: "$discountCode.code"
                        }
                    },
                }
            }
        ]).exec();
    }
    catch (err) {
        return next(err);
    }

    return res.status(HttpStatus.OK).json({ message: "Find order", data: { order }, status: 200, success: true });
};
//UPDATE THE ORDER 
const updateOrder = async function (req, res, next) {
    let order;
    const { id } = req.params;
    const updates = req.body;
    try {
        order = await Order.findByIdAndUpdate(id, { $set: updates }, { new: true }).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }

    if (!order) {
        return res.send(errors.orderNotFoundError);
    }
    return res.status(HttpStatus.OK).json({ message: "Order updated successfully", data: order, status: 200, success: true });
};

//ADD A NEW ORDER
const addOrder = async function (req, res, next) {
    let totalAmount;
    const { userId, orderType, trailId } = req.body;
    let digitalData;
    // totalAmount = products.reduce((amount, obj) => obj.productAmount + amount,0)
    try {

        if (orderType === 1) {
            const order = new Order(req.body);
            const savedOrder = await order.save();
            return res.send({ message: "Order added successfully", data: savedOrder, status: 200, success: true });
        }
        else {
            digitalData = {
                userId,
                orderType,
                trailId
            }
            const order = new Order(digitalData);
            const savedOrder = await order.save();
            return res.send({ message: "Order added successfully", data: savedOrder, status: 200, success: true });
        }
    } catch (err) {
        return next(err);
    }
};

//DELETE AN ORDER
const deleteOrder = async (req, res, next) => {
    let order;
    const { id } = req.params;
    try {
        order = await Order.findByIdAndRemove(id);
    } catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "Order deleted successfully", data: order, status: 200, success: true });
};

//LIST OF ALL ORDERS(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const allOrders = async (req, res, next) => {
    let orderList, totalCount;
    const { userId, orderType } = req.query;
    let { page, pageSize } = req.query;
    totalCount = await Order.countDocuments().exec()
    page = page || 0;
    pageSize = pageSize || totalCount;
    let skip = Number(page * pageSize)
    const filter = {};
    if (userId) {
        filter['userId'] = Types.ObjectId(userId);
        totalCount = await Order.find({ orderType: Number(orderType), userId: Types.ObjectId(userId) }).count().exec()
    }
    if (orderType) {
        filter['orderType'] = Number(orderType)
    }
    try {
        orderList = await Order.aggregate([
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
                $lookup:
                {
                    from: 'couponcodes',
                    let: { couponCode: "$couponCode" },
                    pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$couponCode"] } } },
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $project: {
                            couponCode: '$code',
                            couponPrice: '$amount',
                            couponType: '$type'
                        },
                    }
                    ],
                    as: 'coupon'
                }
            },
            {
                $unwind: { path: '$coupon', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                  from: "products",
                  localField: "products.productId",
                  foreignField: "_id",
                  as: "productDetails"
                }
              },
              {
                $addFields: {
                  productTitles: {
                    $map: {
                      input: '$productDetails',
                      as: 'product',
                      in: '$$product.title'
                    }
                  }
                }
              },
              {
                $lookup: {
                  from: "challenges",
                  localField: "trails.trailId",
                  foreignField: "_id",
                  as: "challengeDetails"
                }
              },
              {
                $addFields: {
                  challengeTitles: {
                    $map: {
                      input: '$challengeDetails',
                      as: 'challenge',
                      in: '$$challenge.title'
                    }
                  }
                }
              },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    products: 1,
                    subTotal: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$coupon.couponType", "Cash Discount"] }, then: { "$subtract": ["$subTotal", "$coupon.couponPrice"] } },
                                { case: { $eq: ["$coupon.couponType", "% Discount"] }, then: { "$subtract": ['$subTotal', { "$multiply": [0.01, { "$multiply": ["$subTotal", "$coupon.couponPrice"] }] }] } }
                            ],
                            default: "$subTotal"
                        }
                    },
                    paymentMethod: 1,
                    address: 1,
                    orderStatus: 1,
                    orderType: 1,
                    trails: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    userPhoto: '$user.photo',
                    name: '$user.name',
                    email: '$user.email',
                    orderNumber: 1,
                    productNames: {
                        $cond: {
                          if: { $eq: ['$productDetails', []] },
                          then: null,
                          else: '$productTitles'
                        }
                      },
                      trailNames: {
                        $cond: {
                          if: { $eq: ['$challengeDetails', []] },
                          then: null,
                          else: '$challengeTitles'
                        }
                      }
                    
                }
            },
        ]).skip(skip).limit(Number(pageSize)).exec();
        //totalCount = await Order.countDocuments().exec()
        if (orderType == 1) {
            totalCount = await Order.find({ orderType: 1 }).count();
        }
        if (orderType == 2) {
            totalCount = await Order.find({ orderType: 2 }).count();
        }
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "All Users Order", data: { orderList, totalCount }, status: 200, success: true });
};


const filterListForeFilled = async (req, res, next) => {
    let orderList, totalCount;
    const { orderType } = req.query;
    try {
        // order = await Order.find().sort({ orderStatus: -1 }).select({photo:1,name:1,email:1,amount:1})
        orderList = await Order.aggregate([
            {
                $match: {
                    orderType: Number(orderType),
                    orderStatus: true
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
                $project: {
                    subTotal: 1,
                    orderStatus: 1,
                    userPhoto: '$user.photo',
                    name: '$user.name',
                    email: '$user.email',
                }
            },
        ]).exec()
        totalCount = orderList.length
    } catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "Filter List Forefilled", data: { orderList, totalCount }, status: 200, success: true });
};


module.exports = {
    findOrder,
    updateOrder,
    addOrder,
    deleteOrder,
    // orderHistory,
    allOrders,
    filterListForeFilled
}