const Joi = require('joi');
const HttpStatus = require('http-status');
const { head } = require('lodash');

const requestValidator = (schema, source = 'body') => async (req, res, next) => {
    const data = req[source];

    try {
        req.item = await Joi.validate(data, schema, {
            stripUnknown: { objects: true, arrays: true },
            convert: true,
            abortEarly: false
        });
    }
    catch (err) {
        if (err.details) {
            err.message = head(err.details).message;
        }
        else {
            console.log('Schema error');
        }
        err.status = HttpStatus.BAD_REQUEST;

        return next(err);
    }

    return next();
};

module.exports = {
    requestValidator
};