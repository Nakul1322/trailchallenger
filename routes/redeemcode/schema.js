const Joi = require('joi');

const addRedeemCode = Joi.object().keys({
    code: Joi.string(),
    quantity: Joi.number().required(),
    trailType: Joi.string().required(),
    redeemed: Joi.boolean(),
});

const getById = Joi.object().keys({
    id: Joi.string().required()
});


module.exports = {
    addRedeemCode,
    getById
};