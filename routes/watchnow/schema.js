const Joi = require("joi");

const getById = Joi.object().keys({
  hikeId: Joi.string().required(),
  userId: Joi.string().required(),
});

module.exports = {
  getById,
};
