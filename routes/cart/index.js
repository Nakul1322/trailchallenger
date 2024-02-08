const express = require('express');
const router = express.Router();
const { requestValidator, checkUserValidity } = require('../../middleware');
const schema = require('./schema');
const cartController = require('../../controllers/cart')

router.get('/countryList',
    cartController.countryList);

router.get('/stateList/:countryCode',
    cartController.stateList);

router.get('/cityList/:countryCode/:stateCode',
    cartController.cityList);

router.post('/get-all-carts',
    cartController.getAllCart);

router.post('/findCart',
    checkUserValidity,
    // requestValidator(schema.getByUserId, 'params'),
    cartController.findUserCart);

router.post('/delete',
    cartController.deleteCart);

router.put('/:id',
    requestValidator(schema.getById, 'params'),
    requestValidator(schema.updateCart),
    cartController.updateCart);

router.post('/shipping',
    requestValidator(schema.shipping),
    cartController.shipping);

router.post('/',
    checkUserValidity,
    // requestValidator(schema.addToCart),
    cartController.addToCart);

router.post('/newShipping',
    // requestValidator(schema.shipping),
    cartController.testShipping);

module.exports = router