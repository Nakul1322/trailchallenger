const Joi = require('joi');

const register = Joi.object().keys({
    email: Joi.string().email().required().lowercase().regex(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).max(35),
    password: Joi.string().required().min(8).max(20),
    name: Joi.string().regex(/^[a-zA-Z ]+$/).min(2).max(35),
    phone: Joi.string().max(10),
    challenge: Joi.array().items(Joi.string()),
    photo: Joi.string(),
    deviceId: Joi.string(),
    deviceToken:Joi.string(),
    deviceType: Joi.number(),
    signUpLoc: Joi.object(),
});

const login = Joi.object().keys({
    email: Joi.string().email().required().lowercase().regex(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/),
    password: Joi.string().required().min(8).max(35),
    deviceToken:Joi.string(),
    deviceType: Joi.number(),
});

const forgotPassword = Joi.object().keys({
    email: Joi.string().email().lowercase().regex(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/).max(35)
});

const resetPassword = Joi.object().keys({
    password: Joi.string().required().min(8).max(35)
});

module.exports = {
    login,
    register,
    forgotPassword,
    resetPassword
}