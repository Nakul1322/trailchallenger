const HttpStatus = require('http-status');
const { toArray } = require('lodash');
const errors = require('../errors');
const AnnouncementButton = require('../models/announcementbutton');
const Announcement = require('../models/announcements');
const AnnouncementUser = require('../models/announcementuser')
const { Types } = require("mongoose");

//FIND THE EXISTING CATEGORY OF PRODUCTS
const findAnnouncement = async (req, res, next) => {
    let announcement;
    try {
        announcement = await AnnouncementButton.findById(req.params.id).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }

    if (!announcement) {
        return res.send(errors.announcementNotFoundError);
    }

    return res.status(HttpStatus.OK).json({ announcement, status: 200, success: true });
};

//ADD THE CATEGORY OF PRODUCTS
const addAnnouncement = async function (req, res, next) {
    const { headline } = req.item;
    try {
        console.log(req.item)
        const announcementExist = await Announcement.findOne({ headline: { '$regex': new RegExp('^' + headline.toLowerCase() + '$', "i") } });
        if (announcementExist) {
            return next(errors.announcementTitleDuplicateError);
        }
        const announcement = new Announcement(req.item);
        const savedAnnouncement = await announcement.save();
        return res.send({ message: req.t('Announcement_Added'), data: savedAnnouncement, status: 200, success: true });
    } catch (err) {
        return next(err);
    }
};

//DELETE THE CATEGORY OF PRODUCTS
const deleteAnnouncement = async (req, res, next) => {
    let announcement;
    const { id } = req.params;
    try {
        const announcementStatus = await AnnouncementButton.findById(id)
        if (announcementStatus.status == false) {
            announcement = await AnnouncementButton.findByIdAndRemove(id);
            return res.send({ message: req.t('Announcement_Deleted'), data: announcement, status: 200, success: true });
        }
        const productAnnouncementExists = await Product.exists({ announcementId: id });
        if (productAnnouncementExists) {
            return res.send({ message: req.t('Announcement_Exist'), data: {}, status: 401, success: false });
            // return next(errors.productAnnouncementExistsError);
        }
        announcement = await AnnouncementButton.findByIdAndRemove(id);
    } catch (err) {
        return next(err);
    }

    return res.status(HttpStatus.OK).json({ message: req.t('Announcement_Deleted'), data: announcement, status: 200, success: true });
};

//LIST OF ALL CATEGORIES OF PRODUCTS(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const getAllAnnouncement = async (req, res, next) => {
    let announcement, totalCount;
    // const { date } = req.body;
    const announcementFilter = {}
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 10;
    let skip = Number(page * pageSize)
    try {
        announcement = await AnnouncementButton.find().skip(skip).limit(Number(pageSize)).exec();
        totalCount = await AnnouncementButton.countDocuments().exec()
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "All Announcement Button List ", data: { announcement, totalCount }, status: 200, success: true });
};

//UPDATE THE CATEGORY OF PRODUCTS
const updateAnnouncement = async function (req, res, next) {
    let announcement;
    const { id } = req.params;
    const updates = req.item;
    try {
        if (status != null) {
            announcement = await AnnouncementButton.findByIdAndUpdate(id, { $set: { status: status } }, { new: true })
        }
        else {
            const announcementExist = await AnnouncementButton.findOne({ _id: { $ne: Number(id) }, title: { '$regex': new RegExp('^' + req.item.title.toLowerCase() + '$', "i") } });
            if (announcementExist) {
                return res.send({ message: 'The announcement of similar title exist', status: 401, success: false })//
                // return next(errors.announcementTitleDuplicateError);
            }
            announcement = await AnnouncementButton.findByIdAndUpdate(id, { $set: updates }, { new: true })
                .select('-__v')
                .exec();
        }
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Announcement_Updated'), data: announcement, status: 200, success: true });
};

//UPDATE THE CATEGORY OF PRODUCTS
const validateAnnouncement = async function (req, res, next) {
    let checkIfViewed, checkIfViewedString, findAllAnnouncementsString, announcementList,findAnnouncement;
    const { currentDate } = req.query;
    const userId = req.header('userId');
    const deviceId = req.header('deviceId')
    try {
        console.log(userId)
        const findAllAnnouncements = await Announcement.find({
            startDate: { $lte: new Date(new Date(currentDate).setHours(00, 00, 00)) },
            expiryDate: { $gte: new Date(new Date(currentDate).setHours(23, 59, 59)) },
            isActive: true
        }).distinct('_id')
        findAllAnnouncementsString = findAllAnnouncements.map(String)
        console.log(findAllAnnouncementsString, "******************")
        if (userId) {
            console.log("7777777777777777")
            checkIfViewed = await AnnouncementUser.find({ userId: Types.ObjectId(userId) }).distinct('announcementId')
            console.log(checkIfViewed, checkIfViewed.length)
            if (checkIfViewed.length == 0) {
                console.log("aaaaaaaaaaaaaaa")
            }
            checkIfViewedString = checkIfViewed.map(String)
            if (!checkIfViewed) {

            }
            console.log("$$$$$$$$$$$$$$$$$$$$$$$", checkIfViewedString)
            const announcementListString = findAllAnnouncementsString.filter((el) => !checkIfViewedString.includes(el));
            announcementList = announcementListString.map(s => Types.ObjectId(s));
            console.log("USERID IF", announcementList)
        }
        if (!userId) {
            console.log("DDDDDDDDDDDDDDDDD")
            checkIfViewed = await AnnouncementUser.find({ deviceId: deviceId }).distinct('announcementId')
            checkIfViewedString = checkIfViewed.map(String)
            const announcementListString = findAllAnnouncementsString.filter((el) => !checkIfViewedString.includes(el));
            announcementList = announcementListString.map(s => Types.ObjectId(s));
        }
        findAnnouncement = await Announcement.find({
            _id: { $in: announcementList },
            startDate: { $lte: new Date(new Date(currentDate).setHours(00, 00, 00)) },
            expiryDate: { $gte: new Date(new Date(currentDate).setHours(23, 59, 59)) },
            isActive: true
        }).sort({ createdAt: 1 }).limit(1).exec()
        console.log(findAnnouncement)
        if (findAnnouncement.length == 0) {
            return res.send(errors.noAnnouncementFound)
        }
        const data = {
            userId, deviceId, isViewed: true, announcementId: findAnnouncement[0]._id
        }
        const announcement = new AnnouncementUser(data);
        await announcement.save();

    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Announcement_Updated'), data: {findAnnouncement}, status: 200, success: true });
};









/*********************************************ANNOUNCEMENT BUTTON APIS************************************************** */

//FIND THE EXISTING CATEGORY OF PRODUCTS
const findAnnouncementButton = async (req, res, next) => {
    let announcement;
    try {
        announcement = await AnnouncementButton.findById(req.params.id).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }

    if (!announcement) {
        return res.send(errors.announcementNotFoundError);
    }

    return res.status(HttpStatus.OK).json({ announcement, status: 200, success: true });
};

//ADD THE CATEGORY OF PRODUCTS
const addAnnouncementButton = async function (req, res, next) {
    const { title } = req.item;
    try {
        console.log(req.item)
        const announcementExist = await AnnouncementButton.findOne({ title: { '$regex': new RegExp('^' + title.toLowerCase() + '$', "i") } });
        if (announcementExist) {
            return next(errors.announcementTitleDuplicateError);
        }
        const announcement = new AnnouncementButton(req.item);
        const savedAnnouncement = await announcement.save();
        return res.send({ message: req.t('Announcement_Added'), data: savedAnnouncement, status: 200, success: true });
    } catch (err) {
        return next(err);
    }
};

//DELETE THE CATEGORY OF PRODUCTS
const deleteAnnouncementButton = async (req, res, next) => {
    let announcement;
    const { id } = req.params;
    try {
        const announcementStatus = await AnnouncementButton.findById(id)
        if (announcementStatus.status == false) {
            announcement = await AnnouncementButton.findByIdAndRemove(id);
            return res.send({ message: req.t('Announcement_Deleted'), data: announcement, status: 200, success: true });
        }
        const productAnnouncementExists = await Product.exists({ announcementId: id });
        if (productAnnouncementExists) {
            return res.send({ message: req.t('Announcement_Exist'), data: {}, status: 401, success: false });
            // return next(errors.productAnnouncementExistsError);
        }
        announcement = await AnnouncementButton.findByIdAndRemove(id);
    } catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Announcement_Deleted'), data: announcement, status: 200, success: true });
};

//LIST OF ALL CATEGORIES OF PRODUCTS(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const getAllAnnouncementButton = async (req, res, next) => {
    let announcement, totalCount;
    // const { date } = req.body;
    const announcementFilter = {}
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 10;
    let skip = Number(page * pageSize)
    try {
        announcement = await AnnouncementButton.find().skip(skip).limit(Number(pageSize)).exec();
        totalCount = await AnnouncementButton.countDocuments().exec()
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "All Announcement Button List ", data: { announcement, totalCount }, status: 200, success: true });
};

//UPDATE THE CATEGORY OF PRODUCTS
const updateAnnouncementButton = async function (req, res, next) {
    let announcement;
    const { id } = req.params;
    const updates = req.item;
    try {
        if (status != null) {
            announcement = await AnnouncementButton.findByIdAndUpdate(id, { $set: { status: status } }, { new: true })
        }
        else {
            const announcementExist = await AnnouncementButton.findOne({ _id: { $ne: Number(id) }, title: { '$regex': new RegExp('^' + req.item.title.toLowerCase() + '$', "i") } });
            if (announcementExist) {
                return res.send({ message: 'The announcement of similar title exist', status: 401, success: false })//
                // return next(errors.announcementTitleDuplicateError);
            }
            announcement = await AnnouncementButton.findByIdAndUpdate(id, { $set: updates }, { new: true })
                .select('-__v')
                .exec();
        }
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Announcement_Updated'), data: announcement, status: 200, success: true });
};

module.exports = {
    findAnnouncement,
    addAnnouncement,
    deleteAnnouncement,
    getAllAnnouncement,
    updateAnnouncement,
    validateAnnouncement,
    findAnnouncementButton,
    addAnnouncementButton,
    deleteAnnouncementButton,
    getAllAnnouncementButton,
    updateAnnouncementButton,
}