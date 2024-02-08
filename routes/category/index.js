const express = require('express');
const router = express.Router();
const { requestValidator } = require('../../middleware');
const schema = require('./schema');
const categoryController = require('../../controllers/category')

router.post('/',
    requestValidator(schema.addCategory),
    categoryController.addCategory);

router.get('/get-all-categories',
    categoryController.getAllCategory);

router.put('/sortCategory',
    categoryController.updateSortCategory);

router.get('/:id',
    requestValidator(schema.getById, 'params'),
    categoryController.findCategory);

router.delete('/:id',
    requestValidator(schema.getById, 'params'),
    categoryController.deleteCategory);

router.put('/:id',
    requestValidator(schema.getById, 'params'),
    requestValidator(schema.updateCategory),
    categoryController.updateCategory);

module.exports = router