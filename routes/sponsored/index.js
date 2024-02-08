const express = require('express');
const router = express.Router();
const { requestValidator, /*checkUserValidity*/ } = require('../../middleware');
const schema = require('./schema');
const sponsoredController = require('../../controllers/sponsored')

router.get('/validateSponsored',
    //checkUserValidity,
    sponsoredController.validateSponsored)

router.get('/get-all-sponsored',
    sponsoredController.getAllSponsored);

router.get('/:id',
    requestValidator(schema.getById, 'params'),
    sponsoredController.findSponsored);

router.post('/',
    // requestValidator(schema.addSponsored),
    sponsoredController.addSponsored);

router.post('/chunksLinks',
    // requestValidator(schema.addSponsored),
    sponsoredController.addChunkLinks);

router.delete('/:id',
    requestValidator(schema.getById, 'params'),
    sponsoredController.deleteSponsored);

router.put('/:id',
    requestValidator(schema.getById, 'params'),
    // requestValidator(schema.updateSponsored),
    sponsoredController.updateSponsored);


module.exports = router