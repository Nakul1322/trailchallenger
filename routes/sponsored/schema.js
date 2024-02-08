const Joi = require('joi');

const addCategory = Joi.object().keys({
    title: Joi.string().required(),
});

const getById = Joi.object().keys({
    id: Joi.string().required()
});

const updateCategory = Joi.object().keys({
    title: Joi.string()
});

module.exports = {
    addCategory,
    getById,
    updateCategory
};