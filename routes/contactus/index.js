const express = require('express');
const router = express.Router();
const { requestValidator, /*checkUserValidity*/ } = require('../../middleware');
const schema = require('./schema');
const contactusController = require('../../controllers/contactus')

router.get('/get-all-contactus',
    contactusController.getAllContactUs);

router.post('/',
    //checkUserValidity,
    requestValidator(schema.addContactUs),
    contactusController.addContactUs);

router.delete('/:id',
    //checkUserValidity,
    requestValidator(schema.getById, 'params'),
    contactusController.deleteContactUs);

module.exports = router