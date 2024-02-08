const express = require('express');
const router = express.Router();
const { requestValidator } = require('../../middleware');
const schema = require('./schema');
const countryController = require('../../controllers/country')

router.put('/status/updateStatusOfCountry',
    countryController.updateStatusOfCountry); 

router.post('/',
    requestValidator(schema.addCountry),
    countryController.addCountry);

router.get('/get-all-countries',
    countryController.getAllCountry);

router.put('/sortCountry',
    countryController.updateSortCountry);

router.get('/:id',
    requestValidator(schema.getById, 'params'),
    countryController.findCountry);

router.delete('/:id',
    requestValidator(schema.getById, 'params'),
    countryController.deleteCountry);

router.put('/:id',
    requestValidator(schema.getById, 'params'),
    requestValidator(schema.updateCountry),
    countryController.updateCountry);


module.exports = router