const HttpStatus = require('http-status');

const errors = require('../errors');
const Sponsored = require('../models/sponsored');
const SponsoredUser = require('../models/sponsoredUser')
const { Types } = require('mongoose')

//FIND THE EXISTING CATEGORY OF PRODUCTS
const findSponsored = async (req, res, next) => {
    let sponsored;
    try {
        sponsored = await Sponsored.findById(req.params.id).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }

    if (!sponsored) {
        return res.send(errors.sponsoredNotFoundError);
    }

    return res.status(HttpStatus.OK).json({ sponsored, status: 200, success: true });
};

const validateSponsored = async (req, res, next) => {
    let sponsored, deleteSponsored;
    const { userId } = req.query
    try {
        sponsored = await Sponsored.findOne({ status: 1 }).exec();
        // deleteSponsored = sponsored.remove();
        const data = {
            link: sponsored.link,
            userId
        }
        const sponsoredUser = new SponsoredUser(data)
        const savedSponsoredUser = await sponsoredUser.save();
        const updateSponsoredStatus = await Sponsored.findByIdAndUpdate(sponsored._id, { $set: { status: 0 } }, { new: true }).exec();
        totalCount = await Sponsored.countDocuments().exec();
    }
    catch (err) {
        return next(err);
    }

    return res.status(HttpStatus.OK).json({ message: "Sponsored link", data: { sponsored, totalCount }, status: 200, success: true });
};
//ADD THE CATEGORY OF PRODUCTS
const addSponsored = async function (req, res, next) {
    try {
        const sponsored = new Sponsored(req.body);
        const savedSponsored = await sponsored.save();
        return res.send({ message: "Sponsored added successfully", data: savedSponsored, status: 200, success: true });
    } catch (err) {
        return next(err);
    }
};

//DELETE THE CATEGORY OF PRODUCTS
const deleteSponsored = async (req, res, next) => {
    let sponsored;
    const { id } = req.params;
    try {
        sponsored = await Sponsored.findByIdAndRemove(id);
    } catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "Sponsored link deleted successfully", data: sponsored, status: 200, success: true });
};

//LIST OF ALL CATEGORIES OF PRODUCTS(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const getAllSponsored = async (req, res, next) => {
    let sponsored;
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 10;
    let skip = Number(page * pageSize)
    try {
        sponsored = await Sponsored.aggregate([
            {
                $lookup: {
                    from: "sponsoredusers",
                    localField: "link",
                    foreignField: "link",
                    as: "sponsoredusers"
                }
            },
            {
                $unwind: { path: "$sponsoredusers", preserveNullAndEmptyArrays: true } //
            },
            {
                $lookup: {
                    from: "users",
                    localField: "sponsoredusers.userId",
                    foreignField: "_id",
                    as: "sponsoredusersUserId"
                }
            },
            {
                $unwind: { path: "$sponsoredusersUserId", preserveNullAndEmptyArrays: true } //
            },
            {
                $project: {
                    _id: 1,
                    link: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    userName:"$sponsoredusersUserId.name"
                }
            }
        ]).skip(skip).limit(Number(pageSize)).exec();
        totalCount = await Sponsored.countDocuments().exec()
    }
    catch (err) {
        return next(err);
    }

    return res.status(HttpStatus.OK).json({ message: "All sponsored link", data: { sponsored, totalCount }, status: 200, success: true });
};

//UPDATE THE CATEGORY OF PRODUCTS
const updateSponsored = async function (req, res, next) {
    let sponsored;
    const { id } = req.params;
    const updates = req.body;
    try {
        sponsored = await Sponsored.findByIdAndUpdate(id, { $set: updates }, { new: true })
            .select('-__v')
            .exec();
    }
    catch (err) {
        return next(err);
    }
    if (!sponsored) {
        return res.send(errors.sponsoredNotFoundError);
    }

    return res.status(HttpStatus.OK).json({ message: "Sponsored link updated successfully", data: sponsored, status: 200, success: true });
};

const addChunkLinks = async function (req, res, next) {
    try {
        const { linkArray } = req.body
        for (let i = 0; i < linkArray.length; i++) {
            const data = {
                link: linkArray[i],
            }
            const sponsored = new Sponsored(data);
            await sponsored.save();
        }
        return res.send({ message: "Sponsored added successfully in bulk", data: {}, status: 200, success: true });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    findSponsored,
    addSponsored,
    deleteSponsored,
    getAllSponsored,
    updateSponsored,
    validateSponsored,
    addChunkLinks
}