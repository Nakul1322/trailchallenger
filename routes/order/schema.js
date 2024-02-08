const Joi = require('joi');

const addOrder = Joi.object().keys({
    title: Joi.string(),
    userId: Joi.string().required(),
    amount: Joi.number(),
    trailId: Joi.string()
});

const updateOrder = Joi.object().keys({
    title: Joi.string(),
    userId: Joi.string(),
    amount: Joi.number(),
    trailId: Joi.string(),
    
});

const getById = Joi.object().keys({
    id: Joi.string().required()
});


module.exports = {
    addOrder,
    getById,
    updateOrder,
};