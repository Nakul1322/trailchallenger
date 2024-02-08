const HttpStatus = require('http-status');
const errors = require('../errors');
const ContactUs = require('../models/contactus');
const GuestUser = require('../models/guestUser');
const sendEmail = require('../helpers/email');
const User = require('../models/user');
const logger = require('../logger/wingston');

//ADD USER POST COMPLAINTS
const addContactUs = async function (req, res, next) {
    const { deviceId , userId} = req.body;
    // const deviceId = req.header('deviceId');
    try {
            const contactus = new ContactUs(req.body);
            const savedContactUs = await contactus.save();
            const findName = await User.findById(userId).exec()
            const file = 'contactus.ejs'
            const link = `${process.env.BASE_URL}/admin/mailbox?type=1`;
            logger.info(`***CONTACT US MODULE***BEFORE SENDING EMAIL CONTACT US EMAIL: userId: ${userId}, userName: ${findName.name}`);
            sendEmail(file, process.env.ADMIN_EMAIL, `${findName.name} ${req.t('Contact_Us_User')}`, link);
            logger.info(`***CONTACT US MODULE***AFTER SENDING EMAIL CONTACT US EMAIL: userId: ${userId}, userName: ${findName.name}`);
            return res.send({ message: req.t('Contact_Us'), data: savedContactUs, status: 200, success: true });
    } catch (err) {
        return next(err);
    }
};

//DELETE USER POST COMPLAINTS
const deleteContactUs = async (req, res, next) => {
    let contactus;
    const { id } = req.params;
    try {
        contactus = await ContactUs.findByIdAndRemove(id);
    } catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Message_Deleted'), data: contactus, status: 200, success: true });
};

//LIST OF ALL USER POST COMPLAINTS(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const getAllContactUs = async (req, res, next) => {
    let contactusList;
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 10;
    let skip = Number(page * pageSize)
    try {
        // contactusList = await ContactUs.find().select('-__v').exec();
        contactusList = await ContactUs.aggregate([
            {
                $sort: { createdAt: -1 }
            },
            {
                $lookup: {
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
                $addFields: {
                    name: "$user.name",
                    email: "$user.email",
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    createdAt: 1,
                    userId: 1,
                    content: 1,
                    createdAt: 1,
                    updatedAt: 1,
                }
            }
        ]).skip(skip).limit(Number(pageSize)).exec();;
        totalCount = await ContactUs.countDocuments().exec()
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "All contact us", data: { contactusList, totalCount }, status: 200, success: true });
};


module.exports = {
    addContactUs,
    deleteContactUs,
    getAllContactUs,
}