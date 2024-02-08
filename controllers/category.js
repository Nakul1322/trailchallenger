const HttpStatus = require('http-status');
const { toArray } = require('lodash');

const errors = require('../errors');
const Category = require('../models/category');
const Product = require('../models/product');

//FIND THE EXISTING CATEGORY OF PRODUCTS
const findCategory = async (req, res, next) => {
    let category;
    try {
        category = await Category.findById(req.params.id).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }

    if (!category) {
        return res.send({ message: req.t('Category_Not_Found'), data: { userExist: true }, status: 409, success: false })
        // return res.send(errors.categoryNotFoundError);
    }

    return res.status(HttpStatus.OK).json({ category, status: 200, success: true });
};

//ADD THE CATEGORY OF PRODUCTS
const addCategory = async function (req, res, next) {
    const { title } = req.item;
    try {
        const categoryExist = await Category.findOne({ title: { '$regex': new RegExp('^' + title.toLowerCase() + '$', "i") } });
        if (categoryExist) {
            return next(errors.categoryTitleDuplicateError);
        }
        const category = new Category(req.item);
        const savedCategory = await category.save();
        return res.send({ message: req.t('Category_Added'), data: savedCategory, status: 200, success: true });
    } catch (err) {
        return next(err);
    }
};

//DELETE THE CATEGORY OF PRODUCTS
const deleteCategory = async (req, res, next) => {
    let category;
    const { id } = req.params;
    try {
        const categoryStatus = await Category.findById(id)
        if (categoryStatus.status == false) {
            category = await Category.findByIdAndRemove(id);
            return res.send({ message: req.t('Category_Deleted'), data: category, status: 200, success: true });
        }
        const productCategoryExists = await Product.exists({ categoryId: id });
        if (productCategoryExists) {
            return res.send({ message: req.t('Category_Exist'), data: {}, status: 401, success: false });
            // return next(errors.productCategoryExistsError);
        }
        category = await Category.findByIdAndRemove(id);
    } catch (err) {
        return next(err);
    }

    return res.status(HttpStatus.OK).json({ message: req.t('Category_Deleted'), data: category, status: 200, success: true });
};

//LIST OF ALL CATEGORIES OF PRODUCTS(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const getAllCategory = async (req, res, next) => {
    let categories,categoryFilter;
    const { isActive } = req.query;
    categoryFilter = {}
    if (isActive == "true") {
        categoryFilter = { status: true }
    }
    try {
        categories = await Category
            .aggregate([
                {
                    $match: categoryFilter
                },
                {
                    $sort: { index: 1 }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: 'categoryId',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        title: 1,
                        status: 1,
                        createdAt: 1,
                        index: 1,
                        count: { $add: [{ $size: '$products' }] }
                    }
                }
            ]).exec();
        totalCount = await Category.countDocuments().exec()
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "All categories ", data: { categories, totalCount }, status: 200, success: true });
};

//UPDATE THE CATEGORY OF PRODUCTS
const updateCategory = async function (req, res, next) {
    let category;
    const { id } = req.params;
    const updates = req.item;
    const { status } = req.body
    try {
        if (status != null) {
            category = await Category.findByIdAndUpdate(id, { $set: { status: status } }, { new: true })
        }
        else {
            const categoryExist = await Category.findOne({ _id: { $ne: Number(id) }, title: { '$regex': new RegExp('^' + req.item.title.toLowerCase() + '$', "i") } });
            if (categoryExist) {
                return res.send({ message: 'The category of similar title exist', status: 401, success: false })//
                // return next(errors.categoryTitleDuplicateError);
            }
            category = await Category.findByIdAndUpdate(id, { $set: updates }, { new: true })
                .select('-__v')
                .exec();
        }
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: req.t('Category_Updated'), data: category, status: 200, success: true });
};

const updateSortCategory = async function (req, res, next) {
    let category;
    const { categoryList } = req.body;
    try {
        const categoryArray = toArray(categoryList)
        const sortedData = categoryArray.sort((a, b) => Number(a._id) - Number(b._id))
        const deletePreviousCategory = await Category.remove();
        for (var i = 0; i < sortedData.length; i++) {
            category = new Category(sortedData[i]);
            await category.save()
        }
    }
    catch (err) {
        return next(err);
    }

    return res.status(HttpStatus.OK).json({ message: req.t('Category_Order'), data: {}, status: 200, success: true });
};

module.exports = {
    findCategory,
    addCategory,
    deleteCategory,
    getAllCategory,
    updateCategory,
    updateSortCategory
}