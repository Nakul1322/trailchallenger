const Joi = require('joi');

const addCms = Joi.object().keys({
    variable: Joi.string(),
    page_title: Joi.string(),
    description: Joi.string(),
    status: Joi.number(),
    isDelete: Joi.boolean(),
    deletedAt: Joi.date(),
});

module.exports = {
    addCms
};