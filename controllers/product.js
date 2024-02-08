const HttpStatus = require('http-status');
const errors = require('../errors');
const Product = require('../models/product');
const Category = require('../models/category');

//FIND THE PRODUCT BASED ON PRODUCT_ID
const findProduct = async (req, res, next) => {
    let product;
    try {
        product = await Product.findById(req.params.id).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }

    if (!product) {
        return res.send(errors.productNotFoundError);
    }
    return res.status(HttpStatus.OK).json({ message: "Find Product", data: product, status: 200, success: true });
};

//UPDATE THE PRODUCT BASED ON PRODUCT_ID
const updateProduct = async function (req, res, next) {
    let product;
    const { id } = req.params;
    const updates = req.body;
    try {
        product = await Product.findByIdAndUpdate(id, { $set: updates }, { new: true }).select('-__v').exec();
    }
    catch (err) {
        return next(err);
    }

    if (!product) {
        return res.send(errors.productNotFoundError);
    }
    return res.status(HttpStatus.OK).json({ message: "Product updated successfully", data: product, status: 200, success: true });
};

//ADD A NEW PRODUCT
const addProduct = async function (req, res, next) {
    let updateCategoryStatus
    const { title, desc, img, categoryId, price } = req.body;
    try {
        const productExist = await Product.findOne({ title: { '$regex': new RegExp('^' + title.toLowerCase() + '$', "i") } });
        if (productExist) {
            return res.send(errors.productTitleDuplicateError);
        }
        const product = new Product(req.body);
        const savedProduct = await product.save();
        console.log(categoryId)
        updateCategoryStatus = await Category.findOneAndUpdate({ _id: categoryId }, { $set: { status: true } }, { new: true });
        console.log(updateCategoryStatus);
        return res.send({ message: "Product added successfully", data: savedProduct, status: 200, success: true });
    } catch (err) {
        return next(err);
    }
};

//DELETE A PRODUCT
const deleteProduct = async (req, res, next) => {
    let product;
    const { id } = req.params;
    try {
        product = await Product.findByIdAndRemove(id);
    } catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "Product deleted successfully", data: product, status: 200, success: true });
};

//ARRAY LISTING OF ALL THE PRODUCTS BASED ON CATEGORY(PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const getAllProduct = async (req, res, next) => {
    let productList, totalCount;
    const { categoryId, productTitle } = req.query
    const filter = { quantity: { $ne: 0 } };
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 10;
    let skip = Number(page * pageSize)
    if (productTitle) {
        filter['title'] = { $regex: `.*${productTitle}.*`, $options: 'i' },
            filter['quantity'] = { $gt: 0 }
    }
    if (categoryId) {
        filter['categoryId'] = Number(categoryId);
    }
    try {
        // productList = await Product.find().populate({path: 'categoryId', model:'category', options: { sort: { 'index': 'asc' } } })
        productList = await Product.aggregate([
            {
                $match: filter
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $lookup:
                {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'categoryId'
                }
            },
            {
                $unwind: '$categoryId'
            },
            {
                $addFields: {
                    categoryName: "$categoryId.title",
                    categoryId: "$categoryId._id",
                    categoryIndex: "$categoryId.index",
                    categoryStatus: "$categoryId.status"
                }
            },
            {
                $match: { categoryStatus: true }
            },
            {
                $group: {
                    _id: '$categoryName',
                    products: { $push: '$$ROOT' }
                }
            },
            {
                $sort: { 'products.categoryIndex': 1 }
            },
            {
                $project: {
                    categoryId: '$_id',
                    products: 1,
                    _id: 0
                }
            }
        ]).skip(skip).limit(Number(pageSize)).exec();
        totalCount = await Product.countDocuments().exec()
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "All Product", data: { productList, totalCount }, status: 200, success: true });
};

//SINGLE LIST OF ALL THE PRODUCTS (PAGINATION IS BEING COMMITTED AS SAID BY ADMIN TEAM AS OF NOW)
const allProduct = async (req, res, next) => {
    let productList, totalCount;
    const filter = {};
    const { productTitle } = req.query
    let { page, pageSize } = req.query;
    page = page || 0;
    pageSize = pageSize || 10;
    let skip = Number(page * pageSize)
    try {
        if (productTitle) {
            filter['title'] = { $regex: `.*${productTitle}.*`, $options: 'i' };
        }
        productList = await Product.aggregate([
            {
                $match: filter
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $lookup:
                {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'categoryId'
                }
            },
            {
                $unwind: '$categoryId'
            },
            {
                $addFields: {
                    categoryName: "$categoryId.title",
                    categoryId: "$categoryId._id",
                    soldOut: false
                }
            },
        ]).skip(skip).limit(Number(pageSize)).exec();
        totalCount = await Product.countDocuments().exec()
    }
    catch (err) {
        return next(err);
    }
    return res.status(HttpStatus.OK).json({ message: "All Product", data: { productList, totalCount }, status: 200, success: true });
};


module.exports = {
    findProduct,
    updateProduct,
    addProduct,
    deleteProduct,
    getAllProduct,
    allProduct
}