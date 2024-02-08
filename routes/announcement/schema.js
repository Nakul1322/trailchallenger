const Joi = require('joi');

const addAnnouncement = Joi.object().keys({
    headline: Joi.string(),
    text: Joi.string(),
    image: Joi.string(),
    buttonText: Joi.string(),
    buttonDestination: Joi.string(),
    startDate: Joi.date(),
    isActive: Joi.boolean(),
    destinationId: Joi.string(),
});

const addAnnouncementButton = Joi.object().keys({
    title: Joi.string(),
    status: Joi.number(),
    type: Joi.number(),
    isSpecific: Joi.boolean(),
});

module.exports = {
    addAnnouncement,
    addAnnouncementButton
};