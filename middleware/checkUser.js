const User = require('../models/user');
const { Types } = require('mongoose');

const checkUserValidity = async function (req, res, next) {
    const userId = req.header('userId');
    let checkUser;
    try {
        console.log(userId);
        checkUser = await User.findOne({ _id: Types.ObjectId(userId), status: "Pending", createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).lean().exec()
        console.log(checkUser);
        if (checkUser) {
            return res.status(403).json({ message: "Please verify your account first", status: 403, success: false });
        }
        else {
            return next(null)
        }
    }
    catch (err) {
        console.log(err);
    }
}
module.exports = {
    checkUserValidity
};
