const errors = require('../errors');
const User = require('../models/user')
const { signAccessToken } = require('../helpers/jwt_helper')
const crypto = require('crypto')
const sendEmail = require('../helpers/email')
const Token = require("../models/token");
const Shipping = require("../models/shipping");
const { Types } = require('mongoose');
const { head } = require('lodash');
const GuestUser = require('../models/guestUser');
const { count } = require('console');
const moment = require('moment');
const MyHike = require('../models/myhikes');
const LeaderBoard = require('../models/leaderboard');
const jwt_decode = require('jwt-decode');
const logger = require('../logger/wingston');

// REGISTRATION API FOR BOTH ADMIN AND USER
module.exports = {
    register: async (req, res, next) => {
        let findGuestUser, deleteGuestUser, user;
        const { email } = req.item;
        const countryId = req.header('countryId') || null;
        try {
            findGuestUser = await GuestUser.findOne({ deviceId: req.body.deviceId })
            const userExist = await User.findOne({ "email": { $regex: new RegExp(email, "i") } });
            if (userExist && userExist.status !== "Deleted") {
                logger.error(`EMAIL ALREADY EXIST,${email}`);
                return res.send({ message: req.t('Email_Exist'), data: { userExist: true }, status: 409, success: false })
                // return res.send(errors.userExistsError);
            }
            req.item.countryId = countryId;
            user = new User(req.item);
            await user.save()
            if (findGuestUser) {
                user = await User.findByIdAndUpdate(user._id, { $push: { challenge: { $each: findGuestUser.challenges } } }, { new: true }).lean().exec();
                deleteGuestUser = await GuestUser.findOneAndDelete({ deviceId: req.body.deviceId }).lean().exec();
            }
            let token = await new Token({
                userId: user._id,
                token: crypto.randomBytes(32).toString("hex"),
            }).save();
            const file = 'emailverify.ejs'
            const link = `${process.env.BASE_URL}/auth/verification-email/${user._id}/${token.token}`;
            logger.info(`***AUTH MODULE***DETAILS OF USER BEFORE SENDING EMAIL AFTER REGISTRATION: name: ${email}, userId: ${user._id}, userName: ${user.name}`);
            sendEmail(file, user.email, req.t('Email_verify'), link);
            logger.info(`***AUTH MODULE***DETAILS OF USER AFTER SENT EMAIL AFTER REGISTRATION SUCCESSFULLY: name: ${email}, userId: ${user._id}, userName: ${user.name}`);
            const accessToken = await signAccessToken(user._id);
            const findHike = await MyHike.findOne({ deviceId: req.header('deviceId') }).exec()
            const findLeaderBoard = await LeaderBoard.findOne({ deviceId: req.header('deviceId') }).exec()
            if (findLeaderBoard) {
                const updateLeaderBoardRecord = await LeaderBoard.updateMany({ deviceId: req.header('deviceId') }, { $set: { userId: user._id } })
                const removeDeviceIdFromLeaderBoardRecord = await LeaderBoard.updateMany({ userId: user._id }, { $set: { deviceId: null } })
            }
            if (findHike) {
                const updateUserHike = await MyHike.updateMany({ deviceId: req.header('deviceId') }, { $set: { userId: user._id } })
                const removeDeviceIdFromHike = await MyHike.updateMany({ userId: user._id }, { $set: { deviceId: null } })
            }
            return res.send({
                data: { accessToken, user }, message: req.t('Registration_Success'), status: 200, success: true
            });
        } catch (error) {
            return next(error);
        }
    },

    // LOGIN API FOR BOTH ADMIN AND USER
    login: async (req, res, next) => {
        let shipping, user;
        const { email, password, deviceToken, deviceType } = req.item;
        try {
            user = await User.findOne({ "email": email.toLowerCase() }).populate('countryId', 'image').exec();
            if (deviceToken) {
                if (user) {
                    user = await User.findByIdAndUpdate(user._id, { $set: { deviceToken: deviceToken, deviceType: deviceType } }, { new: true }).exec()
                }
            }
            if (!user) {
                return res.status(200).json({ message: req.t('Email_Not_Exist'), status: 204, success: false });
                //return res.send(req.t(errors.emailNotExist));
            }
            if (user.status == 'Blocked') {
                //return res.send(errors.userDeactivatedError);
                return res.status(402).json({ message: req.t('User_Blocked'), status: 402, success: false });
            }
            const isMatch = await user.isValidPassword(password);
            if (!isMatch) {
                return res.status(200).json({ message: req.t('Invalid_Password'), status: 404, success: false });
            }
            shipping = await Shipping.findOne({ userId: Types.ObjectId(user.id) }).select({ countryCode: 1, address: 1 }).sort({ createdAt: -1 }).limit(1).lean().exec();
            const accessToken = await signAccessToken(user.id);
            if (user.status == 'Pending') {
                //*********24 hrs functionality in login****************//
                let hours = moment().diff(moment(user.createdAt), 'hours', true);
                console.log(hours)
                if (hours > 24) {
                    return res.status(403).json({ message: req.t('Email_Verify'), status: 403, success: false });
                    // return res.send(errors.userPendingError);
                }
            }
            if (!shipping) {
                return res.send({
                    message: req.t('Login_Success'), data: { accessToken, user }, success: true, status: 200
                });
            }
            const countryCode = shipping.countryCode;
            const address = shipping.address;
            // return res.send({
            //     message: "Login Successful", data: { accessToken, user, countryCode, address }, success: true, status: 200
            // });
            return res.send({
                message: req.t('Login_Success'), data: { accessToken, user, countryCode, address }, success: true, status: 200
            });
        }
        catch (error) {
            return next(error);
        }
    },

    // EMAIL VERIFICATION API 
    verificationEmail: async (req, res, next) => {
        try {
            const user = await User.findOne({ _id: req.params.id });
            if (!user) {
                return res.status(401).json({ message: req.t('Invalid_Link'), status: 401, success: false });
                // return res.send(errors.invalidLinkError);
            }
            const token = await Token.findOne({
                userId: user._id,
                token: req.params.token,
            });
            if (!token) {
                return res.status(401).json({ message: req.t('Invalid_Link'), status: 401, success: false });
                // return res.send(errors.invalidLinkError)
            }
            await User.updateOne({ _id: user._id }, { $set: { isVerified: true, status: 'Active' } });
            await Token.findByIdAndRemove(token._id);
            const file = 'welcomeuser.ejs'
            sendEmail(file, user.email, req.t(`Welcome ${user.name}!`));
            res.send({ message: req.t('Email_Verified'), success: true, status: 200 });
        } catch (error) {
            res.status(400).send(req.t('ERROR'));
        }
    },

    //SEND PASSWORD RESET LINK
    forgotPassword: async (req, res, next) => {
        try {
            let link;
            const { email } = req.item;
            const user = await User.findOne({ "email": { $regex: new RegExp(email, "i") } });
            if (!user) {
                //return res.send(errors.emailNotExist);
                return res.status(402).json({ message: req.t('Email_Not_Exist'), status: 204, success: false });
            }
            if (user.status == 'Pending') {
                //*********24 hrs functionality in login****************//
                let hours = moment().diff(moment(user.createdAt), 'hours', true);
                if (hours > 24) {
                    return res.status(403).json({ message: req.t('Email_Verify'), status: 403, success: false });
                    // return res.send(errors.userPendingError);
                }
            }
            let token = await Token.findOne({ userId: user._id });
            if (!token) {
                token = await new Token({
                    userId: user._id,
                    token: crypto.randomBytes(32).toString("hex"),
                }).save();
            }
            const file = 'resetpassword.ejs'
            if (user) {
                if (user.isAdmin == true) {
                    link = `${process.env.BASE_URL}/reset-password/1/${user._id}/${token.token}`;
                }
                else {
                    link = `${process.env.BASE_URL}/reset-password/2/${user._id}/${token.token}`;
                }
            }
            sendEmail(file, user.email, "Password reset", link);
            res.send({ status: 200, message: req.t('Password_Reset'), success: true });
        } catch (error) {
            res.send("An error occurred");
            console.log(error);
        }
    },

    //RESET USER AND ADMIN PASSWORD
    resetPassword: async (req, res, next) => {
        try {
            const user = await User.findById(req.params.userId);
            if (!user) {
                return res.status(204).json({ message: req.t('Email_Not_Registered'), status: 204, success: false });
                // return res.send(errors.emailNotExist)
            }
            const token = await Token.findOne({
                userId: user._id,
                token: req.params.token,
            });
            if (!token)
                return res.status(401).json({ message: req.t('Invalid_Link'), status: 401, success: false });
            // return res.send(errors.invalidLinkError)
            user.password = req.body.password;
            await user.save();
            await token.delete();
            res.send({ status: 200, message: req.t('Password_Reset_Success'), success: true });
        } catch (error) {
            res.send(req.t('ERROR'));
        }
    },

    resendVerificationEmail: async (req, res, next) => {
        const { email } = req.body;
        try {
            const user = await User.findOne({ "email": { $regex: new RegExp(email, "i") } });
            if (!user) {
                //return res.send(errors.emailNotExist)
                return res.status(402).json({ message: req.t('Email_Not_Exist'), status: 204, success: false });
            }
            if (user && user.status == "Active") {
                return res.send({ message: req.t('Already_Verified'), data: {}, status: 200, success: true })
            }
            if (user && user.status == "Pending") {
                let token = await new Token({
                    userId: user._id,
                    token: crypto.randomBytes(32).toString("hex"),
                }).save();
                const file = 'emailverify.ejs'
                const link = `${process.env.BASE_URL}/auth/verification-email/${user.id}/${token.token}`;
                sendEmail(file, user.email, req.t('Email_verify'), link);
                const accessToken = await signAccessToken(user.id);
                return res.send({
                    data: { accessToken, user }, message: req.t('Email_sent'), status: 200, success: true
                });
            }
        } catch (error) {
            return next(error);
        }
    },

    checkVerifiedUser: async (req, res, next) => {
        const { email } = req.body;
        const token = req.headers['authorization'] || req.headers['Authorization'];
        const decoded = jwt_decode(token);
        console.log(decoded);
        try {
            const user = await User.findOne({ "email": { $regex: new RegExp(email, "i") } });
            if (!user) {
                //return res.send(errors.emailNotExist);
                return res.status(402).json({ message: req.t('Email_Not_Exist'), status: 204, success: false });
            }
            if (user && user.status == "Pending") {
                return res.send({
                    data: {}, message: req.t('Not_Verified'), status: 401, success: false
                });
            }
            if (user && user.status == "Active") {
                // const findUser = await User.findById(token.aud)
                // console.log(findUser)
                // if(findUser){
                //     console.log("FIND USER ")
                //     if(findUser.isVerified == false){
                //         console.log("FIND USER IS NOT VERIFIED")
                //         return res.send({
                //             data: {}, message: req.t('Wrong_Email'), status: 401, success: false
                //         });
                //     }
                // }
                return res.send({ data: {}, message: req.t('Verified'), status: 200, success: true })
            }
        } catch (error) {
            return next(error);
        }
    },

    currentTime: async (req, res, next) => {
        try {
            const Timestamp = moment();
            return res.send({ data: Timestamp, message: "Current TimeStamp", status: 200, success: true })
        } catch (error) {
            return next(error);
        }
    },
}

