const JWT = require('jsonwebtoken')
const errors = require('../errors');
require('dotenv').config()
const User = require('../models/user')

module.exports = {
    signAccessToken: (userId) => {
        return new Promise((resolve, reject) => {
            const payload = {
            }
            const secret = process.env.ACCESS_TOKEN_SECRET
            const options = {
                expiresIn: "7d",
                issuer: "trailchallenger.com",
                audience: userId.toString()
            }
            JWT.sign(payload, secret, options, (err, token) => {
                if (err) {
                    reject(errors.internalError);
                } else {
                    resolve(token);
                }
            })
        })
    },
    verifyAccessToken: (req, res, next) => {
        const jwtToken = req.headers['authorization'] || req.headers['Authorization'];
        if (!jwtToken) {
            return next(null);
        }
        JWT.verify(jwtToken, process.env.ACCESS_TOKEN_SECRET, async (err, payload) => {
            if (err) {
                // return next(errors.unAuthorizedUserError);
                return res.status(406).json({ status: 406, message: "Unauthorized User", success: false })
            } else {
                req.userId = payload.aud;
                let userData = await User.findById(req.userId);
                // User status check
                if (!userData ) {
                    // return next(errors.userDeactivatedError)
                    return res.status(402).json({ status: 402, message: "User is being deactivated by the admin.", success: false })
                }
                if (userData.status == "Blocked" ) {
                    // return next(errors.userDeactivatedError)
                    return res.status(402).json({ status: 402, message: "User is being deactivated by the admin.", success: false })
                }
                return next(null, userData);
            }
        })
    },
}