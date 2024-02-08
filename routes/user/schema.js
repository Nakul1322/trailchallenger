const Joi = require('joi');

const getById = Joi
    .object()
    .keys({
        id: Joi.string().required()
    })
    .required();

const update = Joi.object().keys({
    name: Joi.string().allow(null, '').max(35),
    phone: Joi.string().allow(null, '').max(10),
    challenge: Joi.array().items(Joi.string()),
    inAppNotification: Joi.boolean(),
    notificationToMyPost: Joi.boolean(),
    optOutCommunication: Joi.boolean(),
    email: Joi.string().max(35),
    photo: Joi.string().allow(null),
    language: Joi.string(),
    address: Joi.object(),
    isVerified: Joi.boolean(),
    status: Joi.string(),
    billingAddress: Joi.object(),
    countryId: Joi.number()

});

const changeAdminPassword = Joi.object({
    existingpassword: Joi.string().min(8).max(35),
    newpassword: Joi.string().min(8).max(35)
});

const addUser = Joi.object().keys({
    firstName: Joi.string().required().max(35),
    lastName: Joi.string().required().max(35),
    email: Joi.string().required().max(35),
    inAppNotification: Joi.boolean(),
    notificationToMyPost: Joi.boolean(),
    optOutCommunication: Joi.boolean(),
    address: Joi.object(),
    countryId: Joi.number()
});

const changePassword = Joi.object({
    existingpassword: Joi.string().required().min(8).max(35),
    newpassword: Joi.string().required().min(8).max(35)
});

const userDetails = Joi.object().keys({
    name: Joi.string().required().max(72),
    password: Joi.string().required().max(35),
    email: Joi.string().required().max(35),
    phone: Joi.number(),
    address: Joi.string().required().max(35),
});

module.exports = {
    update,
    getById,
    changeAdminPassword,
    addUser,
    changePassword,
    userDetails
}