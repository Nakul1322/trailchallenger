const Joi = require('joi');

const addNotification = Joi.object().keys({
    notificationMessage: Joi.string().required(),
    userId: Joi.array()
});

const updateNotification = Joi.object().keys({
    notificationMessage: Joi.string(),
    userId: Joi.array()
});

const getById = Joi.object().keys({
    id: Joi.string().required()
});

const getByUserId = Joi.object().keys({
    userId: Joi.string().required()
});


module.exports = {
    addNotification,
    getById,
    getByUserId,
    updateNotification,
};