const Joi = require('joi');

const getById = Joi.object().keys({
    id: Joi.string().required()
});


module.exports = {
    getById
};