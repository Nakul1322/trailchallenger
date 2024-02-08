const HttpStatus = require('http-status');
const errors = require('../errors');
const Cart = require('../models/cart');
const Shipping = require('../models/shipping');
const GuestUser = require('../models/guestUser')
const User = require('../models/user');
const Product = require('../models/product');
const { head } = require('lodash');
const { signAccessToken } = require('../helpers/jwt_helper')
const { Types } = require('mongoose');
const crypto = require('crypto')
const sendEmail = require('../helpers/email')
const Token = require("../models/token");
const RedeemUser = require('../models/redeemcodeuser');
let Country = require('country-state-city').Country;
let State = require('country-state-city').State;
let City = require('country-state-city').City;
const logger = require('../logger/wingston');

const countryList = async (req, res, next) => {
    let allCountries;
    try {
        allCountries = Country.getAllCountries();
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "Country List", data: { allCountries }, status: 200, success: true });
};


const stateList = async (req, res, next) => {
    let allStates;
    const { countryCode } = req.params
    try {
        allStates = State.getStatesOfCountry(countryCode);
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "State List", data: { allStates }, status: 200, success: true });
};

const cityList = async (req, res, next) => {
    let allCities
    const { countryCode, stateCode } = req.params
    try {
        allCities = City.getCitiesOfState(countryCode, stateCode);
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "City List", data: { allCities }, status: 200, success: true });
};

//FIND THE USER CART BASED ON CART ID
const findUserCart = async (req, res, next) => {
    let data;
    const { userId, deviceId } = req.body
    try {
        if (!deviceId) {
            const findCart = await Cart.findOne({ userId: Types.ObjectId(userId) })
            if (!findCart) {
                return res.status(200).json({ message: "Cart not found", status: 200, success: false });
            }
            if (findCart.cartCount == 0) {
                data = await findCart
                return res.send({ message: "Find User Cart", data, status: 200, success: false })
            }
            else {
                data = await Cart.aggregate([
                    {
                        $match:
                        {
                            userId: Types.ObjectId(userId)
                        }
                    },
                    {
                        $unwind: { path: "$products", preserveNullAndEmptyArrays: true } //
                    },
                    {
                        $lookup: {
                            from: "products",
                            localField: "products.productId",
                            foreignField: "_id",
                            as: "products.productId"
                        }
                    },
                    {
                        $addFields:
                        {
                            "products.id": "$products.productId._id",
                            "products.adminQuantity": { $arrayElemAt: ["$products.productId.quantity", 0] },
                        }
                    },
                    {
                        $project: {
                            "products.productId": 0,
                        }
                    },
                    {
                        $addFields:
                        {
                            "products.productId": { $arrayElemAt: ["$products.id", 0] },
                        }
                    },
                    {
                        $project: {
                            "products.id": 0,
                        }
                    },
                    {
                        $group: {
                            _id: "$_id",
                            userId: {
                                $first: "$userId",
                            },
                            subTotal: {
                                $first: "$subTotal"
                            },
                            cartCount: {
                                $first: "$cartCount"
                            },
                            createdAt: {
                                $first: "$createdAt"
                            },
                            updatedAt: {
                                $first: "$updatedAt",
                            },
                            products: { $push: "$products" },
                        }
                    },
                    {
                        $unwind: { path: "$products.productId", preserveNullAndEmptyArrays: true } //
                    },
                    {
                        $addFields:
                        {
                            products: { $reverseArray: "$products" },
                        }
                    },
                ])
                data = head(data)
                return res.send({ message: "Find User Cart", data, status: 200, success: true })
            }
            // data = await Cart.findOne({ userId: Types.ObjectId(userId) })
        }
        if (!userId) {
            const findCart = await Cart.findOne({ deviceId: deviceId })
            if (!findCart) {
                return res.status(200).json({ message: "Cart not found", status: 200, success: false });
            }
            if (findCart.cartCount == 0) {
                data = await findCart
                return res.send({ message: "Find User Cart", data, status: 200, success: false })
            }
            else {
                data = await Cart.aggregate([
                    {
                        $match:
                        {
                            deviceId: deviceId
                        }
                    },
                    {
                        $unwind: { path: "$products", preserveNullAndEmptyArrays: true } //
                    },
                    {
                        $lookup: {
                            from: "products",
                            localField: "products.productId",
                            foreignField: "_id",
                            as: "products.productId"
                        }
                    },
                    {
                        $addFields:
                        {
                            "products.id": "$products.productId._id",
                            "products.adminQuantity": { $arrayElemAt: ["$products.productId.quantity", 0] },
                        }
                    },
                    {
                        $project: {
                            "products.productId": 0,
                        }
                    },
                    {
                        $addFields:
                        {
                            "products.productId": { $arrayElemAt: ["$products.id", 0] },
                        }
                    },
                    {
                        $project: {
                            "products.id": 0,
                        }
                    },
                    {
                        $group: {
                            _id: "$_id",
                            subTotal: {
                                $first: "$subTotal"
                            },
                            cartCount: {
                                $first: "$cartCount"
                            },
                            createdAt: {
                                $first: "$createdAt"
                            },
                            updatedAt: {
                                $first: "$updatedAt",
                            },
                            products: { $push: "$products" },
                        }
                    },
                    {
                        $unwind: { path: "$products.productId", preserveNullAndEmptyArrays: true } //
                    },
                    {
                        $addFields:
                        {
                            products: { $reverseArray: "$products" },
                        }
                    },
                ])
                data = head(data)
                return res.send({ message: "Find User Cart", data, status: 200, success: true })
            }
        }
        if (!data)
            return res.status(200).json({ message: req.t('Cart_Empty'), status: 200, success: false });
    }
    catch (err) {
        return next(err);
    }
    // return res.status(HttpStatus.OK).json({ message: "Find User Cart", data, status: 200, success: true });
};

//UPDATE THE USER CART BASED ON CART ID
const updateCart = async function (req, res, next) {
    let cart;
    let product;
    let data;
    let subTotal = 0;
    const { id } = req.params;
    try {
        product = await Product.findById(req.body.productId).select('-__v').exec();
        if (!product) {
            return res.status(403).json({ message: req.t('Product_Not_Exist'), status: 404, success: false });
        }
        cart = await Cart.findById(id).select('-__v').exec();
        if (!cart) {
            return res.status(401).json({ message: req.t('Cart_Empty'), status: 404, success: false });
        }
        for (var i = 0; i < cart.products.length; i++) {
            if (cart.products[i].productId.toString() === req.body.productId.toString()) {
                let total = product.price * req.body.quantity
                subTotal = subTotal + total
            }
            else {
                subTotal = subTotal + cart.products[i].total
            }
        }

        const totalToUpdate = product.price * req.body.quantity

        await Cart.updateOne(
            { _id: id, "products.productId": req.body.productId },
            { $set: { "subTotal": subTotal, "products.$.quantity": req.body.quantity, "products.$.total": totalToUpdate } }
        )
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Item_Updated'), data: {}, status: 200, success: true });
};

//DELETING PRODUCTS FROM THE CART 
const deleteCart = async (req, res, next) => {
    const { userId, productId, deviceId } = req.body;
    let cart;
    let subTotal = 0;
    let data;
    try {
        if (!deviceId) {
            cart = await Cart.findOne({ userId: Types.ObjectId(userId) })
        }
        if (!userId) {
            cart = await Cart.findOne({ deviceId: deviceId })
        }
        data = await Cart.findByIdAndUpdate(
            { _id: Types.ObjectId(cart._id) },
            {
                $pull: { "products": { productId: productId } }
            },
            { new: true }
        )
        if (userId) {
            data = await Cart.findOne({ userId: userId })
        }
        if (deviceId) {
            data = await Cart.findOne({ deviceId: deviceId })
        }
        for (var i = 0; i < data.products.length; i++) {
            subTotal = subTotal + data.products[i].total
        }
        data = await Cart.findByIdAndUpdate(
            { _id: Types.ObjectId(cart._id) },
            { $set: { "subTotal": subTotal } },
            { new: true }
        )
        cartCount = data.products.length
        data = await Cart.findByIdAndUpdate(
            { _id: Types.ObjectId(cart._id) },
            { $set: { "cartCount": cartCount } },
            { new: true }
        )
    } catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Item_Deleted'), data: {}, status: 200, success: true });
};


const getAllCart = async (req, res, next) => {
    let cartList;
    try {
        cartList = await Cart.find().sort({ createdAt: -1 }).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "All Users Cart", data: cartList, status: 200, success: true });
};

//SHIPPING DETAIL API BEFORE CHECKOUT
const shipping = async (req, res, next) => {
    let { name, address, email, phone, billingAddress, userId } = req.body
    try {
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(401).json({ message: req.t('Cart_Empty'), status: 403, success: false });
        }
        const cartSubTotal = cart.subTotal
        const cartCount = cart.cartCount
        if (!billingAddress) {
            billingAddress = address
        }
        let data = {
            name,
            email,
            address,
            billingAddress: billingAddress,
            isVerified: true,
            isAdmin: false,
            phone: phone,
            status: "Active",
            userId: userId,
            cartSubTotal,
            cartCount
        };
        const user = new Shipping(data);
        await user.save()
        const savedBillingAddress = user.billingAddress
        const shippingId = user._id
        return res.send({
            message: req.t('Address_Saved'), data: { savedBillingAddress, shippingId, cartSubTotal, cartCount }, status: 200, success: true
        })
    }
    catch (err) {
        return next(err);
    }
}
//ADD PRODUCTS TO CART
const addToCart = async (req, res, next) => {
    const { userId, productId, deviceId } = req.body;
    let data = null;
    let cart
    const quantity = Number.parseInt(req.body.quantity);
    if (!deviceId) {
        cart = await Cart.findOne({ userId: userId })
    }
    if (!userId) {
        cart = await Cart.findOne({ deviceId: deviceId })
    }
    const productDetails = await Product.findById(productId);
    const findAdminProductQuantity = await Product.findById(productId)
    //-- Check if cart Exists and Check the quantity if items -------
    if (cart) {
        let indexFound = cart.products.findIndex(p => p.productId == productId);
        //----------check if product exist,just add the previous quantity wit h the new quantity and update the total price-------
        if (indexFound != -1) {
            const cartProductQty = cart.products[indexFound].quantity + quantity;
            if (cartProductQty > findAdminProductQuantity.quantity) {
                return res.send({ status: 400, message: "Purchase limit exceeds", success: false })
            }
            cart.products[indexFound].quantity = cart.products[indexFound].quantity + quantity;
            cart.products[indexFound].total = cart.products[indexFound].quantity * productDetails.price;
            cart.products[indexFound].price = productDetails.price
            cart.products[indexFound].desc = productDetails.desc,
                cart.products[indexFound].title = productDetails.title,
                cart.products[indexFound].img = productDetails.img[0],
                cart.subTotal = cart.products.map(product => product.total).reduce((acc, curr) => acc + curr);
            cart.cartCount = cart.cartCount
        }
        //----Check if Quantity is Greater than 0 then add item to items Array ----
        else if (quantity > 0) {
            cart.products.push({
                productId: productId,
                quantity: quantity,
                price: productDetails.price,
                desc: productDetails.desc,
                title: productDetails.title,
                img: productDetails.img[0],
                total: parseInt(productDetails.price * quantity).toFixed(2),
            })
            cart.subTotal = cart.products.map(product => product.total).reduce((acc, curr) => acc + curr);
            cart.cartCount = cart.cartCount + 1;
        }
        //----if quantity of price is 0 throw the error -------
        else {
            return res.status(400).json({
                status: 400, message: "Invalid request", success: false
            })
        }

        data = await cart.save();
    }
    //------if there is no user with a cart then it creates a new cart and then adds the item to the cart that has been created---------
    else {
        const cartData = {
            userId: userId,
            products: [{
                productId: productId,
                quantity: quantity,
                price: productDetails.price,
                total: parseInt(productDetails.price * quantity),
                title: productDetails.title,
                desc: productDetails.desc,
                img: productDetails.img[0]
            }],
            subTotal: parseInt(productDetails.price * quantity),
            cartCount: 1,
            deviceId: deviceId
        }
        cart = new Cart(cartData);
        data = await cart.save();
    }

    return res.status(200).send({
        status: 200, message: req.t('Item_Added'), data: cart, success: true
    });
}

//SHIPPING DETAIL API BEFORE CHECKOUT
const testShipping = async (req, res, next) => {
    let cartSubTotal = 0;
    let cart, redeemCode;
    let savedUserId;
    let cartCount = 0;
    let { name, address, email, phone, billingAddress, userId, deviceId, password, trailId, countryCode, code, deviceToken, deviceType, signUpLoc } = req.body
    try {
        if (!billingAddress) {
            billingAddress = address
        }
        if (!deviceId) {
            cart = await Cart.findOne({ userId: userId })
        }
        if (!userId) {
            cart = await Cart.findOne({ deviceId: deviceId })
        }
        const userExist = await User.findOne({ "email": { $regex: new RegExp(email, "i") } });
        if (userExist && password) {
            return res.send({ message: req.t('Email_Exist'), data: { userExist: true }, status: 409, success: false })
        }
        if (!userExist && trailId) {
            const emailExist = await User.findOne({ "email": { $regex: new RegExp(email, "i") } })
            if (emailExist) {
                return res.send({ message: req.t('Email_Exist'), status: 401, success: false })
            }
            const data = {
                name,
                email,
                address,
                isVerified: false,
                isAdmin: false,
                phone: phone,
                status: "Pending",
                deviceId,
                deviceToken,
                deviceType,
                password,
                signUpLoc
            }
            const user = new User(data);
            await user.save()
            savedUserId = user._id
            await User.findByIdAndUpdate(
                user._id,
                { $addToSet: { challenge: trailId } },
                { new: true }
            );
            let token = await new Token({
                userId: user._id,
                token: crypto.randomBytes(32).toString("hex"),
            }).save();
            const file = 'emailverify.ejs'
            const link = `${process.env.BASE_URL}/auth/verification-email/${user.id}/${token.token}`;
            logger.info(`***CART MODULE***BEFORE SENDING EMAIL VERIFICATION EMAIL: name: ${email}, userId: ${user._id}, userName: ${user.name}`);
            sendEmail(file, user.email, req.t('Email_verify'), link);
            logger.info(`***CART MODULE***AFTER VERIFICATION EMAIL IS SENT: name: ${email}, userId: ${user._id}, userName: ${user.name}`);
            const accessToken = await signAccessToken(user.id);
            let shippingData = {
                name,
                email,
                address,
                billingAddress: billingAddress,
                phone: phone,
                countryCode,
                userId: Types.ObjectId(savedUserId)
            };
            const shipping = new Shipping(shippingData);
            await shipping.save()
            const removeGuest = await GuestUser.findOneAndRemove({ deviceId: deviceId });
            if (password) {
                return res.send({
                    message: req.t('Account_Created'), data: { accessToken, user, address: shipping.address, shippingId: shipping._id, cartSubTotal, cartCount, redeemCode }, status: 200, success: true
                })
            }
            if (!password) {
                return res.send({
                    message: req.t('Address_Saved'), data: { accessToken, user, address: shipping.address, shippingId: shipping._id, cartSubTotal, cartCount, redeemCode }, status: 200, success: true
                })
            }
        }
        if (cart) {
            cartSubTotal = cart.subTotal;
            cartCount = cart.cartCount;
        }
        if (!userExist) {
            const emailExist = await User.findOne({ "email": { $regex: new RegExp(email, "i") } })
            if (emailExist) {
                return res.send({ message: req.t('Email_Exist'), status: 401, success: false })
            }
            const userData = {
                name,
                email,
                address,
                isVerified: true,
                status: 'Active',
                isAdmin: false,
                phone,
                password,
                deviceId,
                deviceToken,
                deviceType,
                signUpLoc
            }
            const user = new User(userData);
            await user.save()
            savedUserId = user._id
            const accessToken = await signAccessToken(user.id);
            let data = {
                name,
                email,
                address,
                billingAddress: billingAddress,
                phone: phone,
                userId: Types.ObjectId(savedUserId),
                countryCode
            };
            const shipping = new Shipping(data);
            await shipping.save()
            console.log(shipping)
            const updateCartUserId = await Cart.findOneAndUpdate({ deviceId: deviceId }, { $set: { userId: Types.ObjectId(savedUserId) } })
            const removeDeviceId = await Cart.findByIdAndUpdate(savedUserId, { $set: { deviceId: null } })
            const updateShippingUserId = await Shipping.findOneAndUpdate({ deviceId: deviceId }, { $set: { userId: Types.ObjectId(savedUserId) } })
            const removeGuest = await GuestUser.findOneAndRemove({ deviceId: deviceId });
            if (password) {
                return res.send({
                    message: req.t('Account_Created'), data: { accessToken, user, address: shipping.address, shippingId: shipping._id, cartSubTotal, cartCount }, status: 200, success: true
                })
            } if (!password) {
                return res.send({
                    message: req.t('Address_Saved'), data: { accessToken, user, address: shipping.address, shippingId: shipping._id, cartSubTotal, cartCount }, status: 200, success: true
                })
            }
        }
        if (userExist && trailId) {
            let data = {
                name,
                email,
                address,
                billingAddress: billingAddress,
                phone: phone,
                userId: userExist._id,
                countryCode,
            };
            const shippingData = new Shipping(data);
            await shippingData.save()
            const updatedUser = await User.findByIdAndUpdate(
                userExist._id,
                { $addToSet: { challenge: trailId } },
                { new: true }
            );
            const updatePhoneNumber = await User.findByIdAndUpdate(userExist._id, { $set: { phone: phone } }, { new: true })
            const accessToken = await signAccessToken(userExist.id);
            const savedBillingAddress = shippingData.billingAddress
            const shippingId = shippingData._id
            const findRedeemCode = await RedeemUser.findOne({ userId: Types.ObjectId(userExist.id), status: false }).sort({ createdAt: -1 })
            if (findRedeemCode) {
                redeemCode = findRedeemCode.code
            }
            if (!findRedeemCode) {
                redeemCode = null
            }
            return res.send({
                message: req.t('Address_Saved'), data: { user: updatedUser, accessToken, address: shippingData.address, shippingId: shippingId, cartSubTotal, cartCount, redeemCode }, status: 200, success: true
            })
        }
        if (userExist) {
            let data = {
                name,
                email,
                address,
                billingAddress: billingAddress,
                phone: phone,
                userId: userId,
                countryCode,
            };
            const user = new Shipping(data);
            await user.save()
            const findRegisteredUser = await User.findById(userId).exec()
            const updatePhoneNumber = await User.findByIdAndUpdate(findRegisteredUser._id, { $set: { phone: phone } }, { new: true })
            const accessToken = await signAccessToken(findRegisteredUser._id);
            const savedBillingAddress = user.billingAddress
            const shippingId = user._id
            return res.send({
                message: req.t('Address_Saved'), data: { user: findRegisteredUser, address: user.address, accessToken, shippingId: user._id, cartSubTotal, cartCount }, status: 200, success: true
            })
        }
    }
    catch (err) {
        return next(err);
    }
}

module.exports = {
    countryList,
    stateList,
    cityList,
    findUserCart,
    updateCart,
    deleteCart,
    getAllCart,
    shipping,
    addToCart,
    testShipping
}