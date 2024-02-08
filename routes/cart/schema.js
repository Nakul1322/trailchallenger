const Joi = require('joi');

const addToCart = Joi.object().keys({
    userId: Joi.string().required(),
    productId: Joi.string(),
    quantity: Joi.number(),
    price: Joi.number()
    
});

const getById = Joi.object().keys({
    id: Joi.string().required()
});

const getByProductId = Joi.object().keys({
    productId: Joi.string().required()
});

const getByUserId = Joi.object().keys({
    userId: Joi.string().required()
});

const updateCart = Joi.object().keys({
    _id: Joi.string(),
    productId: Joi.string(),
    quantity: Joi.number(),
    amount: Joi.number()
});

const shipping = Joi.object().keys({
    userId: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().required(),
    address: Joi.string().required(),
    billingAddress: Joi.string().allow(''),
    phone: Joi.number().required(),
});

module.exports = {
    addToCart,
    getById,
    getByUserId,
    updateCart,
    shipping,
    getByProductId
};