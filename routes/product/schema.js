const Joi = require('joi');

const addProduct = Joi.object().keys({
    title: Joi.string().required(),
    desc: Joi.string().required(),
    img: Joi.array().required(),
    categoryId: Joi.string().required(),
    price: Joi.number().required(),
    aboutTheProduct: Joi.string().required(),
    quantity: Joi.number().required()
});

const updateProduct = Joi.object().keys({
    title: Joi.string(),
    desc: Joi.string(),
    img: Joi.array(),
    categoryId: Joi.string(),
    price: Joi.number(),
    aboutTheProduct: Joi.string(),
    quantity: Joi.number()
});

const getById = Joi.object().keys({
    id: Joi.string().required()
});


module.exports = {
    addProduct,
    getById,
    updateProduct,
};