const Joi = require('joi');

const addCouponCode = Joi.object().keys({
    code:Joi.string(),
    amount:Joi.number().required(),
    type:Joi.string().required(),
    couponed:Joi.boolean(),
    expires: Joi.date() 
});

const getById = Joi.object().keys({
    id: Joi.string().required()
});


module.exports = {
    addCouponCode,
    getById
};