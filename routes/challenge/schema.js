const Joi = require('joi');

const addChallenge = Joi.object().keys({
    title: Joi.string().required(),
    challengeType: Joi.string().required(),
    colorGradient: Joi.array().items(Joi.string()).allow(null, ''),
    distance: Joi.number().required(),
    price: Joi.number().required(),
    image: Joi.string(),
    howItWorks: Joi.string().required(),
    difficulty: Joi.number().required(),
    elevation: Joi.number().required(),
    withRedemption: Joi.boolean()
});

const updateChallenge = Joi.object().keys({
    title: Joi.string(),
    colorGradient: Joi.array().items(Joi.string()).allow(null, ''),
    distance: Joi.number(),
    price: Joi.number(),
    image: Joi.string(),
    howItWorks: Joi.string(),
    difficulty: Joi.number(),
    elevation: Joi.number(),
    withRedemption: Joi.boolean(),
    route: Joi.object()
});

const getById = Joi.object().keys({
    id: Joi.string().required()
});


module.exports = {
    addChallenge,
    getById,
    updateChallenge,
};