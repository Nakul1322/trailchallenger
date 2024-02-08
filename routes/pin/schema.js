const Joi = require('joi');

const addCategory = Joi.object().keys({
    title: Joi.string().required(),
    index:Joi.number(),
    status: Joi.boolean()
});

const getById = Joi.object().keys({
    id: Joi.string().required()
});

const updateCategory = Joi.object().keys({
    title: Joi.string(),
    index:Joi.number(),
    status: Joi.boolean()
});

module.exports = {
    addCategory,
    getById,
    updateCategory
};