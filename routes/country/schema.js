const Joi = require('joi');

const addCountry = Joi.object().keys({
    title: Joi.string().required(),
    index:Joi.number(),
    image: Joi.string(),
    status: Joi.boolean()
});

const getById = Joi.object().keys({
    id: Joi.string().required()
});

const updateCountry = Joi.object().keys({
    title: Joi.string(),
    index:Joi.number(),
    image: Joi.string(),
    status: Joi.boolean()
});

module.exports = {
    addCountry,
    getById,
    updateCountry
};