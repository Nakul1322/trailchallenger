const Joi = require('joi');

const addCommunity = Joi.object().keys({
    content: Joi.string().required(),
    userId: Joi.string().required(),
    totalComment: Joi.number(),
    img: Joi.array().items(Joi.string()),
    postType: Joi.number(),
    trailName: Joi.string()
});

const getById = Joi.object().keys({
    id: Joi.string().required()
});

const updateCommunity = Joi.object().keys({
    content: Joi.string(),
    userId: Joi.string(),
    totalComment: Joi.number(),
    img: Joi.array().items(Joi.string()),
    postType: Joi.number(),
    trailName: Joi.string()
});

module.exports = {
    addCommunity,
    getById,
    updateCommunity
};