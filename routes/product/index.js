const express = require('express');
const router = express.Router();
const { requestValidator, /*checkUserValidity*/ } = require('../../middleware');
const { verifyAccessToken } = require('../../helpers/jwt_helper')
const schema = require('./schema');
const productController = require('../../controllers/product')

router.post('/',
    //checkUserValidity,
    //verifyAccessToken,
    requestValidator(schema.addProduct),
    productController.addProduct);

router.get('/get-all-products',
    verifyAccessToken,
    //checkUserValidity,
    productController.getAllProduct);

router.get('/productList',
    // checkUserValidity,
    productController.allProduct);

router.get('/:id',
    //checkUserValidity,
    requestValidator(schema.getById, 'params'),
    productController.findProduct);

router.put('/:id',
    //checkUserValidity,
    //verifyAccessToken,
    requestValidator(schema.getById, 'params'),
    requestValidator(schema.updateProduct),
    productController.updateProduct);

router.delete('/:id',
    //checkUserValidity,
    //verifyAccessToken,
    requestValidator(schema.getById, 'params'),
    productController.deleteProduct);

module.exports = router