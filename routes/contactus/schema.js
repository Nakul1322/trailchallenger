const Joi = require('joi');

const addContactUs = Joi.object().keys({
    content: Joi.string().required(),
    userId: Joi.string().required()
});

const getById = Joi.object().keys({
    id: Joi.string().required()
});


module.exports = {
    addContactUs,
    getById
};